const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ─── GET /api/notifications ───────────────────────────────────────────────────
// List the current user's notifications, newest first.
// Query params: ?unread=true  ?limit=50 (default 50, max 100)
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const unreadOnly = req.query.unread === 'true';
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  try {
    const where = unreadOnly
      ? 'WHERE n.user_id = ? AND n.is_read = 0'
      : 'WHERE n.user_id = ?';

    const [rows] = await pool.query(
      `SELECT
         n.notification_id, n.user_id, n.ticket_id, n.message,
         n.is_read, n.created_at,
         t.ticket_title, t.ticket_status
       FROM notification n
       LEFT JOIN ticket t ON n.ticket_id = t.ticket_id
       ${where}
       ORDER BY n.created_at DESC, n.notification_id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error('GET /notifications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/notifications/unread-count ──────────────────────────────────────
// Cheap endpoint for polling the bell badge.
router.get('/unread-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM notification WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return res.status(200).json({ count: Number(rows[0].count) || 0 });
  } catch (err) {
    console.error('GET /notifications/unread-count error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/notifications/latest ────────────────────────────────────────────
// Newest notification after a given id/timestamp — used to drive the toast
// popup without re-fetching the whole list on every poll.
router.get('/latest', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const sinceId = parseInt(req.query.sinceId, 10) || 0;

  try {
    const [rows] = await pool.query(
      `SELECT
         n.notification_id, n.user_id, n.ticket_id, n.message,
         n.is_read, n.created_at,
         t.ticket_title
       FROM notification n
       LEFT JOIN ticket t ON n.ticket_id = t.ticket_id
       WHERE n.user_id = ? AND n.notification_id > ?
       ORDER BY n.notification_id ASC
       LIMIT 20`,
      [userId, sinceId]
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error('GET /notifications/latest error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
// NOTE: defined before /:id/read so Express doesn't try to match "read-all"
// as an :id param on a differently-ordered router.
router.patch('/read-all', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(
      `UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('PATCH /notifications/read-all error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      `UPDATE notification SET is_read = 1 WHERE notification_id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    return res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('PATCH /notifications/:id/read error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      `DELETE FROM notification WHERE notification_id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    return res.status(200).json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('DELETE /notifications/:id error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;