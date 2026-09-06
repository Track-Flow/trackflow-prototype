const pool = require("../config/db");
const router = require("express").Router();
const { authenticateToken } = require("../middleware/auth");
const { notify, notifyRole } = require("../services/notifyService");
const upload = require('../middleware/upload');

const path = require('path');
const fs = require('fs');

const SLA_HOURS = 24;

async function runEscalationSweep(pool) {
  const [candidates] = await pool.query(
    `SELECT ticket_id, department_id, ticket_created_at
     FROM ticket
     WHERE ticket_status NOT IN ('resolved', 'closed')
       AND ticket_escalated = 0
       AND ticket_created_at <= NOW() - INTERVAL ? HOUR`,
    [SLA_HOURS]
  );

  if (candidates.length === 0) return;

  for (const ticket of candidates) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[current]] = await conn.query(
        `SELECT ticket_escalated, ticket_status FROM ticket WHERE ticket_id = ? FOR UPDATE`,
        [ticket.ticket_id]
      );
      if (!current || current.ticket_escalated || ['resolved', 'closed'].includes(current.ticket_status)) {
        await conn.rollback();
        conn.release();
        continue;
      }

      await conn.query(
        `UPDATE ticket SET ticket_escalated = 1 WHERE ticket_id = ?`,
        [ticket.ticket_id]
      );

      let escalatedTo = null;
      if (ticket.department_id) {
        const [[manager]] = await conn.query(
          `SELECT user_id FROM user WHERE user_role = 'mss_manager' AND department_id = ? LIMIT 1`,
          [ticket.department_id]
        );
        escalatedTo = manager?.user_id ?? null;
      }
      if (!escalatedTo) {
        const [[admin]] = await conn.query(
          `SELECT user_id FROM user WHERE user_role = 'admin' LIMIT 1`
        );
        escalatedTo = admin?.user_id ?? null;
      }

      if (escalatedTo) {
        await conn.query(
          `INSERT INTO escalation_log (ticket_id, escalated_by, escalated_to, reason, escalated_at)
           VALUES (?, NULL, ?, ?, NOW())`,
          [ticket.ticket_id, escalatedTo, `SLA breached: ticket open more than ${SLA_HOURS}h without resolution.`]
        );
      }

      await conn.commit();

      if (escalatedTo) {
        notifyRole({
          role: 'mss_manager',
          departmentId: ticket.department_id,
          ticketId: ticket.ticket_id,
          message: `Ticket #${ticket.ticket_id} has breached its ${SLA_HOURS}h SLA and has been escalated.`,
        });
      }
    } catch (err) {
      await conn.rollback();
      console.error(`Escalation sweep failed for ticket ${ticket.ticket_id}:`, err);
    } finally {
      conn.release();
    }
  }
}


// GET /api/tickets/:id/attachment/download
router.get('/:id/attachment/download', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [[att]] = await pool.query(
      `SELECT a.file_name, a.file_path, a.mime_type, t.user_id, t.assigned_user_id
       FROM attachment a JOIN ticket t ON a.ticket_id = t.ticket_id
       WHERE a.ticket_id = ?`,
      [id]
    );
    if (!att) return res.status(404).json({ error: 'No attachment found for this ticket.' });

    const isOwner = req.user.role === 'end_user' && att.user_id === req.user.id;
    const isAssignedTla = req.user.role === 'tla' && att.assigned_user_id === req.user.id;
    const isPrivileged = req.user.role === 'mss_manager' || req.user.role === 'admin';
    if (!isOwner && !isAssignedTla && !isPrivileged) {
      return res.status(403).json({ error: 'You do not have permission to view this attachment.' });
    }

    const fullPath = path.join(__dirname, '..', 'uploads', att.file_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File no longer exists on disk.' });

    res.setHeader('Content-Type', att.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(att.file_name)}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error('Attachment download error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

//get all tickets
router.get('/', authenticateToken, async (req, res) => {
  try {

    await runEscalationSweep(pool);


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
        a.user_id   AS assignee_id,
        att.attachment_id,
        att.file_name  AS attachment_file_name,
        att.file_size  AS attachment_file_size,
        att.mime_type  AS attachment_mime_type,
        fb.feedback_id,
        fb.rating      AS feedback_rating,
        fb.comment     AS feedback_comment,
        fb.submitted_at AS feedback_submitted_at
       FROM ticket t
       LEFT JOIN user       u   ON t.user_id         = u.user_id
       LEFT JOIN department d   ON t.department_id    = d.department_id
       LEFT JOIN category   c   ON t.category_id      = c.category_id
       LEFT JOIN user       a   ON t.assigned_user_id = a.user_id
       LEFT JOIN attachment att ON att.ticket_id       = t.ticket_id
       LEFT JOIN feedback   fb  ON fb.ticket_id        = t.ticket_id
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


// POST /api/tickets/:id/escalate — manual escalation by MSS Manager
router.post('/:id/escalate', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (req.user.role !== 'mss_manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only MSS Managers or Admins can escalate a ticket.' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'A reason is required to escalate a ticket.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[ticket]] = await conn.query(
      `SELECT ticket_id, ticket_status, ticket_escalated, department_id
       FROM ticket WHERE ticket_id = ? FOR UPDATE`,
      [id]
    );

    if (!ticket) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (['resolved', 'closed'].includes(ticket.ticket_status)) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'Cannot escalate a resolved or closed ticket.' });
    }

    if (ticket.ticket_escalated) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'This ticket has already been escalated.' });
    }

    await conn.query(`UPDATE ticket SET ticket_escalated = 1 WHERE ticket_id = ?`, [id]);

    await conn.query(
      `INSERT INTO escalation_log (ticket_id, escalated_by, escalated_to, reason, escalated_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, req.user.id, req.user.id, reason.trim()]
    );

    await conn.commit();

    notifyRole({
      role: 'mss_manager',
      departmentId: ticket.department_id,
      ticketId: id,
      message: `Ticket #${id} was manually escalated by ${req.user.id}.`,
    });

    const [rows] = await pool.query('SELECT * FROM ticket WHERE ticket_id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('Manual escalation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    conn.release();
  }
});

// ─── POST /api/tickets/:id/flag-department ────────────────────────────────────
// TLA, MSS Manager, or Admin flags a ticket as sent to the wrong department.
// Requires a short reason. Mechanism: move the ticket to the "Other" category
// (same category the end-user picks when nothing fits), which per the
// existing category rules clears department_id to NULL — this is exactly the
// same "open to any TLA" state as a ticket submitted under Other, reusing all
// existing visibility plumbing rather than inventing a new status/flag.
// Also unassigns the current TLA and resets ticket_status back to 'open'
// (clearing resolved_at too) — whatever progress had been made under the
// wrong department doesn't carry over, since the right team is starting
// fresh. Blocked once resolved/closed, and blocked if it's already unrouted
// (nothing to flag — it's already open to everyone).

router.post('/:id/flag-department', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const requesting_user_role = req.user.role;
  const requesting_user_id   = req.user.id;

  if (!['tla', 'mss_manager', 'admin'].includes(requesting_user_role)) {
    return res.status(403).json({ error: 'Only TLAs, MSS Managers, or Admins can flag a ticket as wrong department.' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'A reason is required to flag a ticket as wrong department.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[ticket]] = await conn.query(
      `SELECT ticket_id, ticket_status, ticket_title, department_id, category_id, assigned_user_id
       FROM ticket WHERE ticket_id = ? FOR UPDATE`,
      [id]
    );

    if (!ticket) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (['resolved', 'closed'].includes(ticket.ticket_status)) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'Cannot flag a resolved or closed ticket.' });
    }

    if (ticket.department_id == null) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'This ticket is already unrouted and open to every TLA.' });
    }

    // A TLA may only flag a ticket that is actually assigned to them —
    // otherwise anyone could yank tickets out of another TLA's queue.
    if (requesting_user_role === 'tla' && ticket.assigned_user_id !== requesting_user_id) {
      await conn.rollback();
      conn.release();
      return res.status(403).json({ error: 'You can only flag tickets assigned to you.' });
    }

    const [[otherCategory]] = await conn.query(
      `SELECT category_id FROM category WHERE LOWER(category_name) = 'other' LIMIT 1`
    );
    if (!otherCategory) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ error: 'The "Other" category is not configured.' });
    }

    const oldDepartmentId = ticket.department_id;
    const oldStatus = ticket.ticket_status;

    await conn.query(
      `UPDATE ticket
       SET category_id = ?,
           department_id = NULL,
           assigned_user_id = NULL,
           ticket_status = 'open',
           resolved_at = NULL,
           ticket_updated_at = NOW()
       WHERE ticket_id = ?`,
      [otherCategory.category_id, id]
    );

    await conn.query(
      `INSERT INTO ticket_status_log (ticket_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, 'open', ?, ?)`,
      [id, oldStatus, requesting_user_id,
       `Flagged as wrong department by ${requesting_user_id}, reset to open: ${reason.trim()}`]
    );

    await conn.commit();

    // Tell the manager(s) of the department it's leaving, and the TLA it was
    // unassigned from (if that wasn't the person doing the flagging).
    notifyRole({
      role: 'mss_manager',
      departmentId: oldDepartmentId,
      ticketId: id,
      message: `Ticket #${id} "${ticket.ticket_title}" was flagged as wrong department by ${requesting_user_id}, reset to open, and is now open to any TLA. Reason: ${reason.trim()}`,
    });
    if (ticket.assigned_user_id && ticket.assigned_user_id !== requesting_user_id) {
      notify({
        userId: ticket.assigned_user_id,
        ticketId: id,
        message: `Ticket #${id} "${ticket.ticket_title}" was flagged as wrong department, reset to open, and removed from your queue.`,
      });
    }

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
      [id]
    );

    return res.status(200).json({ message: 'Ticket flagged as wrong department, reset to open, and is now open to any TLA.', ticket: rows[0] });
  } catch (err) {
    await conn.rollback();
    console.error('Flag-department error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    conn.release();
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


router.post("/", authenticateToken, upload.single('file'), async (req, res) => {
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
    await conn.beginTransaction();

    // --- Resolve department from category ---
    const [categories] = await conn.query(
      "SELECT department_id, category_name FROM category WHERE category_id = ?",
      [category_id],
    );

    if (categories.length === 0) {
      await conn.rollback();
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

    // --- Insert attachment, if one was uploaded ---
    if (req.file) {
      await conn.query(
        `INSERT INTO attachment (ticket_id, file_name, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?)`,
        [ticketId, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype]
      );
    }

    await conn.commit();

    // --- Notify: confirm submission to the End User (UC01 step 11) ---
    // Fire-and-forget — notifyService never throws, so this can't fail the request.
    notify({
      userId: user_id,
      ticketId,
      message: `Your ticket #${ticketId} has been submitted successfully. Reference: TKT-${String(ticketId).padStart(4, '0')}.`,
    });

    // --- Notify: alert TLAs in the routed department (UC01 step 12) ---
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
    if (conn) {
      try { await conn.rollback(); } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    console.error("Create ticket error:", err);
    if (err.message?.includes('File type not allowed')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 10MB.' });
    }
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

// POST /api/tickets/:id/feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user_id = req.user.id;

  if (req.user.role !== 'end_user') {
    return res.status(403).json({ error: 'Only the requester can submit feedback.' });
  }

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'Rating is required and must be a whole number from 1 to 5.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [[ticket]] = await conn.query(
      'SELECT ticket_id, user_id FROM ticket WHERE ticket_id = ?',
      [id]
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (ticket.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only submit feedback on your own tickets.' });
    }

    await conn.query(
      `INSERT INTO feedback (ticket_id, user_id, rating, comment, submitted_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, user_id, rating, comment?.trim() || null]
    );

    const [rows] = await conn.query('SELECT * FROM feedback WHERE ticket_id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Feedback has already been submitted for this ticket.' });
    }
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'Internal server error.' });
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

    // FIX: 'closed' must NOT fall into the reset branch — resolved_at was
    // being wiped back to NULL every time the auto-close cron flipped a
    // ticket from resolved -> closed, breaking SLA/reporting calculations.
    // Only a genuine reopen (open/in_progress/struggling) should clear it.
    if (effectiveStatus === 'resolved') {
      fields.push('resolved_at = NOW()');
    } else if (effectiveStatus !== undefined && !['resolved', 'closed'].includes(effectiveStatus)) {
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