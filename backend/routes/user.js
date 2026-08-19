const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ─── GET /api/users/me ────────────────────────────────────────────────────────

router.get('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [userRows] = await pool.query(
      `SELECT u.user_id, u.user_name, u.user_email, u.user_role, u.user_status,
              u.department_id, u.created_at, u.updated_at,
              d.department_name
       FROM user u
       LEFT JOIN department d ON d.department_id = u.department_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRows[0];
    let stats = {};

    if (user.user_role === 'tla') {
      const [rows] = await pool.query(
        `SELECT
           COUNT(*) AS assigned_total,
           SUM(CASE WHEN ticket_status IN ('open','in_progress','struggling') THEN 1 ELSE 0 END) AS assigned_active,
           SUM(CASE WHEN ticket_status = 'resolved' THEN 1 ELSE 0 END) AS resolved_total,
           SUM(CASE WHEN ticket_status = 'closed' THEN 1 ELSE 0 END) AS closed_total
         FROM ticket WHERE assigned_user_id = ?`,
        [userId]
      );
      const row = rows[0];
      stats = {
        assigned_total: Number(row.assigned_total) || 0,
        assigned_active: Number(row.assigned_active) || 0,
        resolved_total: Number(row.resolved_total) || 0,
        closed_total: Number(row.closed_total) || 0,
      };
    } else if (user.user_role === 'end_user') {
      const [rows] = await pool.query(
        `SELECT
           COUNT(*) AS submitted_total,
           SUM(CASE WHEN ticket_status IN ('open','in_progress','struggling') THEN 1 ELSE 0 END) AS submitted_open,
           SUM(CASE WHEN ticket_status IN ('resolved','closed') THEN 1 ELSE 0 END) AS submitted_resolved
         FROM ticket WHERE user_id = ?`,
        [userId]
      );
      const row = rows[0];
      stats = {
        submitted_total: Number(row.submitted_total) || 0,
        submitted_open: Number(row.submitted_open) || 0,
        submitted_resolved: Number(row.submitted_resolved) || 0,
      };
    } else if (user.user_role === 'mss_manager' || user.user_role === 'admin') {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS logged_actions FROM ticket_status_log WHERE changed_by = ?`,
        [userId]
      );
      stats = { logged_actions: Number(rows[0].logged_actions) || 0 };
    }

    res.json({
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.user_email,
        role: user.user_role,
        status: user.user_status,
        department_id: user.department_id,
        department_name: user.department_name,
        created_at: user.created_at,
      },
      stats,
    });
  } catch (err) {
    console.error('GET /users/me error:', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────

router.patch('/me', authenticateToken, async (req, res) => {
  const { user_name, user_email } = req.body;
  const userId = req.user.id;

  if (!user_name?.trim() || !user_email?.trim()) {
    return res.status(400).json({ error: 'Username and email are required.' });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(user_email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT user_id FROM user WHERE user_email = ? AND user_id != ?',
      [user_email, userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    await pool.query(
      'UPDATE user SET user_name = ?, user_email = ? WHERE user_id = ?',
      [user_name.trim(), user_email.trim(), userId]
    );

    const [rows] = await pool.query(
      'SELECT user_id AS id, user_name, user_email, user_role, department_id FROM user WHERE user_id = ?',
      [userId]
    );

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('PATCH /users/me error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;