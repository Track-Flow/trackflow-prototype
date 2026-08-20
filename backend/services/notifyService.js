const pool = require('../config/db');

// ─── notify ───────────────────────────────────────────────────────────────────
// Single-recipient notification. Never throws — failures are logged so the
// calling route's real work (ticket create/update/etc.) always completes,
// matching UC04 A4 (notification dispatch failure does not block the action).
async function notify({ userId, ticketId = null, message }) {
  if (!userId || !message) {
    console.error('notifyService.notify: userId and message are required', { userId, ticketId, message });
    return null;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO notification (user_id, ticket_id, message, is_read, created_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [userId, ticketId, message]
    );

    const [rows] = await pool.query(
      `SELECT notification_id, user_id, ticket_id, message, is_read, created_at
       FROM notification WHERE notification_id = ?`,
      [result.insertId]
    );

    return rows[0] ?? null;
  } catch (err) {
    console.error('notifyService.notify failed:', err);
    return null;
  }
}

// ─── notifyMany ───────────────────────────────────────────────────────────────
// Fan-out the same message to several recipients (e.g. all managers in a dept).
async function notifyMany({ userIds, ticketId = null, message }) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const results = await Promise.all(
    userIds.map((userId) => notify({ userId, ticketId, message }))
  );
  return results.filter(Boolean);
}

// ─── notifyRole ───────────────────────────────────────────────────────────────
// Resolve every active user with a given role (optionally scoped to a
// department) and fan the message out to them.
async function notifyRole({ role, departmentId = null, ticketId = null, message }) {
  try {
    let rows;
    if (departmentId) {
      [rows] = await pool.query(
        `SELECT user_id FROM user
         WHERE user_role = ? AND user_status = 'active' AND department_id = ?`,
        [role, departmentId]
      );
    } else {
      [rows] = await pool.query(
        `SELECT user_id FROM user WHERE user_role = ? AND user_status = 'active'`,
        [role]
      );
    }

    const userIds = rows.map((r) => r.user_id);
    return notifyMany({ userIds, ticketId, message });
  } catch (err) {
    console.error('notifyService.notifyRole failed:', err);
    return [];
  }
}

module.exports = { notify, notifyMany, notifyRole };