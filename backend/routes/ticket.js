const pool = require("../config/db");
const router = require("express").Router();
const { authenticateToken } = require("../middleware/auth");
const { notify, notifyRole } = require("../services/notifyService");

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

// get ticket lifecycle / status history
router.get("/:id/history", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [ticketRows] = await pool.query(
      "SELECT ticket_id FROM ticket WHERE ticket_id = ?",
      [id]
    );
    if (ticketRows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const [rows] = await pool.query(
      `SELECT
        l.log_id,
        l.ticket_id,
        l.old_status,
        l.new_status,
        l.changed_by,
        u.user_name AS changed_by_name,
        l.note,
        l.changed_at
       FROM ticket_status_log l
       LEFT JOIN user u ON l.changed_by = u.user_id
       WHERE l.ticket_id = ?
       ORDER BY l.changed_at ASC, l.log_id ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch history error:", err);
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

    const ticketId = result.insertId;

    // --- Notify: confirm submission to the End User (UC01 step 11) ---
    // Fire-and-forget — notifyService never throws, so this can't fail the request.
    notify({
      userId: user_id,
      ticketId,
      message: `Your ticket #${ticketId} has been submitted successfully. Reference: TKT-${String(ticketId).padStart(4, '0')}.`,
    });

    // --- Notify: alert TLAs in the routed department (UC01 step 12) ---
    // Only fires when the category maps to a real department — "Other"
    // tickets have no department_id and go to the unrouted queue instead,
    // which isn't wired up yet.
    if (!isOther && department_id) {
      notifyRole({
        role: 'tla',
        departmentId: department_id,
        ticketId,
        message: `New ticket #${ticketId} in your queue: "${ticket_title}".`,
      });
    }

    return res.status(201).json({
      message: "Ticket created successfully.",
      ticket_id: ticketId,
    });
  } catch (err) {
    console.error("Create ticket error:", err);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});


router.post("/check-duplicate", authenticateToken, async (req, res) => {
  const { ticket_title } = req.body;
  const user_id = req.user.id;

  if (!ticket_title) {
    return res.status(400).json({ error: "ticket_title is required." });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [dupes] = await conn.query(
      `SELECT ticket_id, ticket_title, ticket_status, ticket_created_at
       FROM ticket
       WHERE user_id = ?
         AND ticket_status NOT IN ('resolved', 'closed')
         AND (
           ticket_title = ?
           OR ticket_title LIKE CONCAT('%', ?, '%')
         )
       ORDER BY ticket_created_at DESC
       LIMIT 5`,
      [user_id, ticket_title, ticket_title],
    );

    return res.status(200).json({ duplicates: dupes });
  } catch (err) {
    console.error("Duplicate check error:", err);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

// ─── POST /api/tickets/:id/reopen ─────────────────────────────────────────────
// Dedicated reopen route. Only TLA (must be the current assignee),
// mss_manager, or admin can reopen. Only valid from resolved/closed.
// Requires a non-empty `reason`. Keeps the existing assignee.
router.post("/:id/reopen", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const requesting_user_id   = req.user.id;
  const requesting_user_role = req.user.role;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "A reason is required to reopen a ticket." });
  }

  if (!["tla", "mss_manager", "admin"].includes(requesting_user_role)) {
    return res.status(403).json({ error: "Not authorised to reopen tickets." });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [tickets] = await conn.query(
      "SELECT * FROM ticket WHERE ticket_id = ?",
      [id]
    );
    if (tickets.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Ticket not found." });
    }

    const ticket = tickets[0];
    const oldStatus = ticket.ticket_status;

    if (!["resolved", "closed"].includes(oldStatus)) {
      await conn.rollback();
      return res.status(409).json({ error: "Only resolved or closed tickets can be reopened." });
    }

    // TLA can only reopen tickets they were assigned to
    if (requesting_user_role === "tla" && ticket.assigned_user_id !== requesting_user_id) {
      await conn.rollback();
      return res.status(403).json({ error: "You can only reopen tickets assigned to you." });
    }

    // Keep the existing assignee — just flip status and clear resolved_at
    await conn.query(
      `UPDATE ticket
       SET ticket_status = 'open',
           resolved_at = NULL,
           resolution_note = ?,
           ticket_updated_at = NOW()
       WHERE ticket_id = ?`,
      [reason.trim(), id]
    );

    await conn.query(
      `INSERT INTO ticket_status_log (ticket_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, 'open', ?, ?)`,
      [id, oldStatus, requesting_user_id, `Reopened by ${requesting_user_id}: ${reason.trim()}`]
    );

    const [updatedRows] = await conn.query(
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
      [id]
    );

    await conn.commit();

    // --- Notify: ticket reopened ---
    // Reopener is always tla/mss_manager/admin (end users can't hit this route),
    // so the assigned TLA is who needs telling — unless they're the one who
    // did it, in which case they already know.
    const reopenedTicket = updatedRows[0];
    if (reopenedTicket.assigned_user_id && reopenedTicket.assigned_user_id !== requesting_user_id) {
      notify({
        userId: reopenedTicket.assigned_user_id,
        ticketId: id,
        message: `Ticket #${id} "${reopenedTicket.ticket_title}" was reopened. Reason: ${reason.trim()}`,
      });
    }

    return res.status(200).json({
      message: "Ticket reopened successfully.",
      ticket: reopenedTicket,
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    console.error("Reopen ticket error:", err);
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
    await conn.beginTransaction();

    // --- Check ticket exists ---
    const [tickets] = await conn.query(
      "SELECT * FROM ticket WHERE ticket_id = ?",
      [id]
    );
    if (tickets.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Ticket not found." });
    }

    const ticket = tickets[0];
    const oldStatus = ticket.ticket_status;

    // --- Authorisation ---
    if (requesting_user_role === "end_user") {
      if (ticket.user_id !== requesting_user_id) {
        await conn.rollback();
        return res.status(403).json({ error: "Not authorised to update this ticket." });
      }
      if (ticket.ticket_status !== "open") {
        await conn.rollback();
        return res.status(403).json({ error: "You can only edit tickets that are still open." });
      }
    }

    // --- Determine if this request is a claim (assigning a TLA) ---
    const isClaim = requesting_user_role !== "end_user" && assignee_id !== undefined;

    if (isClaim && ["resolved", "closed"].includes(ticket.ticket_status)) {
      await conn.rollback();
      return res.status(409).json({ error: "Cannot claim a resolved or closed ticket." });
    }

    // Auto-progress: claiming with no explicit status moves the ticket to in_progress
    let effectiveStatus = ticket_status;
    if (isClaim && ticket_status === undefined) {
      effectiveStatus = "in_progress";
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

    if (effectiveStatus === 'resolved') {
      fields.push('resolved_at = NOW()');
    } else if (effectiveStatus !== undefined && effectiveStatus !== 'resolved') {
      fields.push('resolved_at = NULL'); // reopened — reset it
    }

    if (resolution_notes !== undefined) {
      fields.push("resolution_note = ?");
      values.push(resolution_notes);
    }

    // Only tla / mss_manager / admin can update these fields
    if (requesting_user_role !== "end_user") {

      if (effectiveStatus !== undefined) {
        const validStatuses = ["open", "in_progress", "struggling", "resolved", "closed"];
        if (!validStatuses.includes(effectiveStatus)) {
          await conn.rollback();
          return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        fields.push("ticket_status = ?");
        values.push(effectiveStatus);
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
          await conn.rollback();
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
          await conn.rollback();
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
      await conn.rollback();
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    fields.push("ticket_updated_at = NOW()");
    values.push(id);

    await conn.query(
      `UPDATE ticket SET ${fields.join(", ")} WHERE ticket_id = ?`,
      values
    );

    // --- Log status change ---
    // Always write a note: explicit resolution_notes wins, otherwise generate
    // a sensible default so ticket_status_log.note is never blank for a real
    // status transition. This is what powers the lifecycle popup.
    if (effectiveStatus !== undefined && effectiveStatus !== oldStatus) {
      let note = resolution_notes ?? null;

      if (!note) {
        if (isClaim) {
          note = `Claimed by ${requesting_user_id}`;
        } else {
          const AUTO_NOTES = {
            "open->in_progress":       `Started by ${requesting_user_id}`,
            "in_progress->open":       `Unclaimed / reopened by ${requesting_user_id}`,
            "in_progress->struggling": `Flagged as struggling by ${requesting_user_id}`,
            "struggling->in_progress": `Resumed by ${requesting_user_id}`,
            "struggling->open":        `Reopened from struggling by ${requesting_user_id}`,
            "resolved->open":          `Reopened by ${requesting_user_id}`,
            "resolved->in_progress":   `Reopened and resumed by ${requesting_user_id}`,
            "open->resolved":          `Resolved by ${requesting_user_id}`,
            "in_progress->resolved":   `Resolved by ${requesting_user_id}`,
            "struggling->resolved":    `Resolved by ${requesting_user_id}`,
            "resolved->closed":        `Auto-closed 24h after resolution`,
          };
          note = AUTO_NOTES[`${oldStatus}->${effectiveStatus}`]
            ?? `Status changed from ${oldStatus} to ${effectiveStatus} by ${requesting_user_id}`;
        }
      }

      await conn.query(
        `INSERT INTO ticket_status_log (ticket_id, old_status, new_status, changed_by, note)
         VALUES (?, ?, ?, ?, ?)`,
        [id, oldStatus, effectiveStatus, requesting_user_id, note]
      );
    }

    const [updated] = await conn.query(
      "SELECT * FROM ticket WHERE ticket_id = ?",
      [id]
    );

    await conn.commit();

    const updatedTicket = updated[0];

    // ─── Notifications (fire-and-forget, post-commit) ─────────────────────────
    // Ticket owner (end user) is who these are aimed at throughout — they're
    // the one who wants to know what's happening to their ticket.
    const ownerId = updatedTicket.user_id;

    if (isClaim) {
      // UC04 step 9: confirm assignment to the claiming TLA
      if (assignee_id) {
        notify({
          userId: assignee_id,
          ticketId: id,
          message: `You've been assigned ticket #${id}: "${updatedTicket.ticket_title}".`,
        });
      }
      // UC04 step 10: tell the end user their ticket is being worked on
      notify({
        userId: ownerId,
        ticketId: id,
        message: `Your ticket #${id} has been assigned and is being worked on.`,
      });
    } else if (effectiveStatus !== undefined && effectiveStatus !== oldStatus) {
      if (effectiveStatus === 'struggling') {
        notify({
          userId: ownerId,
          ticketId: id,
          message: `Your ticket #${id} is flagged as struggling.${resolution_notes ? ' ' + resolution_notes : ''}`,
        });
      } else if (effectiveStatus === 'resolved') {
        notify({
          userId: ownerId,
          ticketId: id,
          message: `Your ticket #${id} has been resolved.${resolution_notes ? ' ' + resolution_notes : ''}`,
        });
      } else {
        // General status change (UC05 step 7) — covers open/in_progress/etc.
        notify({
          userId: ownerId,
          ticketId: id,
          message: `Your ticket #${id} status has been updated to: ${effectiveStatus}.`,
        });
      }
    }

    // Wrong-department reassignment flag: a TLA/manager clears department_id
    // or moves the ticket back to "open" with no assignee while flagging it
    // for the MSS Manager. We detect it here as: assignee cleared to null via
    // explicit assignee_id === null, sent by a tla.
    if (requesting_user_role === 'tla' && req.body.assignee_id === null && updatedTicket.department_id) {
      notifyRole({
        role: 'mss_manager',
        departmentId: updatedTicket.department_id,
        ticketId: id,
        message: `Ticket #${id} flagged for reassignment by ${requesting_user_id}.`,
      });
    }

    return res.status(200).json({ message: "Ticket updated successfully.", ticket: updatedTicket });

  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    console.error("Update ticket error:", err);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});
module.exports = router;