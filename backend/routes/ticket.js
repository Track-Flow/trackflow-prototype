const pool = require("../config/db");
const router = require("express").Router();
const { authenticateToken } = require("../middleware/auth");

//get all tickets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.*,
        u.user_name,
        d.department_name,
        a.user_name  AS assignee_name,
        a.user_id    AS assignee_id
      FROM ticket t
      LEFT JOIN user u       ON t.user_id          = u.user_id
      LEFT JOIN department d ON t.department_id     = d.department_id
      LEFT JOIN user a       ON t.assigned_user_id  = a.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get ticket by id
//get ticket by id
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT
        t.*,
        u.user_name,
        d.department_name,
        c.category_name,
        a.user_name AS assignee_name,
        a.user_id   AS assignee_id
       FROM ticket t
       LEFT JOIN user       u ON t.user_id         = u.user_id
       LEFT JOIN department d ON t.department_id    = d.department_id
       LEFT JOIN category   c ON t.category_id      = c.category_id
       LEFT JOIN user       a ON t.assigned_user_id = a.user_id
       WHERE t.ticket_id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//create a new ticket

router.post("/", authenticateToken, async (req, res) => {
  const { ticket_title, ticket_description, category_id } = req.body;
  const user_id = req.user.id; // from JWT payload

  // --- Validation ---
  if (!ticket_title || !ticket_description || !category_id) {
    return res.status(400).json({
      error: "ticket_title, ticket_description, and category_id are required.",
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // --- Resolve department from category ---
    const [categories] = await conn.query(
      "SELECT department_id, category_name FROM category WHERE category_id = ?",
      [category_id],
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: "Category not found." });
    }

    const { department_id, category_name } = categories[0];
    const isOther = category_name?.toLowerCase() === "other";

    // --- Insert ticket ---
    const [result] = await conn.query(
      `INSERT INTO ticket 
        (ticket_title, ticket_description, ticket_status, ticket_escalated, user_id, category_id, department_id)
       VALUES (?, ?, 'open', 0, ?, ?, ?)`,
      [
        ticket_title,
        ticket_description,
        user_id,
        category_id,
        isOther ? null : department_id,
      ],
    );

    return res.status(201).json({
      message: "Ticket created successfully.",
      ticket_id: result.insertId,
    });
  } catch (err) {
    console.error("Create ticket error:", err);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

// Patch /api/tickets/:id
router.patch("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    ticket_title,
    ticket_description,
    ticket_status,
    ticket_escalated,
    category_id,
    assignee_id,
    resolution_notes,
  } = req.body;

  const requesting_user_id   = req.user.id;
  const requesting_user_role = req.user.role;

  let conn;
  try {
    conn = await pool.getConnection();

    // --- Check ticket exists ---
    const [tickets] = await conn.query(
      "SELECT * FROM ticket WHERE ticket_id = ?",
      [id]
    );
    if (tickets.length === 0) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const ticket = tickets[0];
    const oldStatus = ticket.ticket_status;

    // --- Authorisation ---
    if (requesting_user_role === "end_user") {
      if (ticket.user_id !== requesting_user_id) {
        return res.status(403).json({ error: "Not authorised to update this ticket." });
      }
      if (ticket.ticket_status !== "open") {
        return res.status(403).json({ error: "You can only edit tickets that are still open." });
      }
    }

    // --- Build dynamic update ---
    const fields = [];
    const values = [];

    if (ticket_title !== undefined) {
      fields.push("ticket_title = ?");
      values.push(ticket_title);
    }

    if (ticket_description !== undefined) {
      fields.push("ticket_description = ?");
      values.push(ticket_description);
    }

    if (ticket_status === 'resolved') {
      fields.push('resolved_at = NOW()');
    } else if (ticket_status !== undefined && ticket_status !== 'resolved') {
      fields.push('resolved_at = NULL'); // reopened — reset it
    }

    if (resolution_notes !== undefined) {
      fields.push("resolution_note = ?");
      values.push(resolution_notes);
    }

    // Only tla / mss_manager / admin can update these fields
    if (requesting_user_role !== "end_user") {

      if (ticket_status !== undefined) {
        const validStatuses = ["open", "in_progress", "struggling", "resolved", "closed"];
        if (!validStatuses.includes(ticket_status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        fields.push("ticket_status = ?");
        values.push(ticket_status);
      }

      if (ticket_escalated !== undefined) {
        fields.push("ticket_escalated = ?");
        values.push(ticket_escalated ? 1 : 0);
      }

      if (assignee_id !== undefined) {
        const [assignee] = await conn.query(
          "SELECT user_id FROM user WHERE user_id = ? AND user_role = ?",
          [assignee_id, "tla"]
        );
        if (assignee.length === 0) {
          return res.status(404).json({ error: "Assigned TLA not found." });
        }
        fields.push("assigned_user_id = ?");
        values.push(assignee_id);
      }

      if (category_id !== undefined) {
        const [categories] = await conn.query(
          "SELECT department_id, category_name FROM category WHERE category_id = ?",
          [category_id]
        );
        if (categories.length === 0) {
          return res.status(404).json({ error: "Category not found." });
        }
        const { department_id, category_name } = categories[0];
        const isOther = category_name?.toLowerCase() === "other";
        fields.push("category_id = ?");
        values.push(category_id);
        fields.push("department_id = ?");
        values.push(isOther ? null : department_id);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    fields.push("ticket_updated_at = NOW()");
    values.push(id);

    await conn.query(
      `UPDATE ticket SET ${fields.join(", ")} WHERE ticket_id = ?`,
      values
    );

    // --- Log status change ---
    if (ticket_status !== undefined && ticket_status !== oldStatus) {
      await conn.query(
        `INSERT INTO ticket_status_log (ticket_id, old_status, new_status, changed_by, note)
         VALUES (?, ?, ?, ?, ?)`,
        [id, oldStatus, ticket_status, requesting_user_id, resolution_notes ?? null]
      );
    }

    const [updated] = await conn.query(
      "SELECT * FROM ticket WHERE ticket_id = ?",
      [id]
    );
    return res.status(200).json({ message: "Ticket updated successfully.", ticket: updated[0] });

  } catch (err) {
    console.error("Update ticket error:", err);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
