const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');

// ─── Middleware: admin only ───────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.user_id, u.user_name, u.user_email,
        u.user_role, u.user_status, u.department_id,
        d.department_name,
        u.created_at, u.updated_at
      FROM user u
      LEFT JOIN department d ON u.department_id = d.department_id
      ORDER BY u.user_role, u.user_name
    `);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/admin/departments ──────────────────────────────────────────────

router.get('/departments', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT department_id, department_name FROM department ORDER BY department_name'
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/admin/users ────────────────────────────────────────────────────
// Create a new TLA account with department assignment

router.post('/users', requireAdmin, async (req, res) => {
  const { user_id, user_name, user_email, password, department_id } = req.body;

  if (!user_id || !user_name || !user_email || !password) {
    return res.status(400).json({ error: 'user_id, user_name, user_email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO user (user_id, user_name, user_email, user_password_hash, user_role, user_status, department_id)
       VALUES (?, ?, ?, ?, 'tla', 'active', ?)`,
      [user_id, user_name, user_email, hashedPassword, department_id ?? null]
    );

    // Return the created user with department name
    const [rows] = await pool.query(`
      SELECT
        u.user_id, u.user_name, u.user_email,
        u.user_role, u.user_status, u.department_id,
        d.department_name,
        u.created_at, u.updated_at
      FROM user u
      LEFT JOIN department d ON u.department_id = d.department_id
      WHERE u.user_id = ?
    `, [user_id]);

    return res.status(201).json({ message: 'TLA created successfully.', user: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A user with that ID or email already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/admin/users/:id ──────────────────────────────────────────────

const VALID_ROLES    = ['end_user', 'tla', 'mss_manager', 'admin'];
const VALID_STATUSES = ['active', 'inactive'];

router.patch('/users/:id', requireAdmin, async (req, res) => {
  const { id }                                         = req.params;
  const { user_role, user_status, department_id }      = req.body;

  if (user_role   && !VALID_ROLES.includes(user_role))    return res.status(400).json({ error: `Invalid role.` });
  if (user_status && !VALID_STATUSES.includes(user_status)) return res.status(400).json({ error: `Invalid status.` });

  const fields = [];
  const values = [];

  if (user_role   !== undefined) { fields.push('user_role = ?');    values.push(user_role);    }
  if (user_status !== undefined) { fields.push('user_status = ?');  values.push(user_status);  }
  if (department_id !== undefined) { fields.push('department_id = ?'); values.push(department_id ?? null); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE user SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found.' });

    const [rows] = await pool.query(`
      SELECT
        u.user_id, u.user_name, u.user_email,
        u.user_role, u.user_status, u.department_id,
        d.department_name,
        u.created_at, u.updated_at
      FROM user u
      LEFT JOIN department d ON u.department_id = d.department_id
      WHERE u.user_id = ?
    `, [id]);

    return res.status(200).json({ message: 'User updated.', user: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;