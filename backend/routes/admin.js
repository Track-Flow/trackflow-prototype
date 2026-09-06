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

// Admin or MSS Manager (used for department Read per UC rules)
function requireAdminOrManager(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'mss_manager') {
    return res.status(403).json({ error: 'Access denied. Admins or MSS Managers only.' });
  }
  next();
}

// MSS Manager only — used for the manager's own TLA-management endpoints below.
// Kept separate from requireAdminOrManager because these routes are scoped
// tighter than a plain "read" check: they let a manager write to `user` rows,
// so admin is deliberately NOT included here (admins already have the
// unrestricted /users routes above; mixing the two would blur which endpoint
// is the authority for a given change).
function requireManager(req, res, next) {
  if (req.user?.role !== 'mss_manager') {
    return res.status(403).json({ error: 'Access denied. MSS Managers only.' });
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
  const { id }                                    = req.params;
  const { user_role, user_status, department_id } = req.body;

  if (user_role   && !VALID_ROLES.includes(user_role))      return res.status(400).json({ error: `Invalid role.` });
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

// ══════════════════════════════════════════════════════════════════════════
// Manager TLA management
// MSS Manager can see every TLA (all departments, not just their own) and can
// deactivate/reactivate a TLA or move one to a different department. Scoped
// strictly to user_role = 'tla' — a manager can never touch end users, other
// managers, or admins, and can never change someone's role (that stays an
// admin-only action via PATCH /api/admin/users/:id above).
// ══════════════════════════════════════════════════════════════════════════

// ─── GET /api/admin/manager/tlas ──────────────────────────────────────────────

router.get('/manager/tlas', requireManager, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.user_id, u.user_name, u.user_email,
        u.user_status, u.department_id,
        d.department_name,
        u.created_at, u.updated_at
      FROM user u
      LEFT JOIN department d ON u.department_id = d.department_id
      WHERE u.user_role = 'tla'
      ORDER BY u.user_name
    `);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/admin/manager/tlas/:id ────────────────────────────────────────
// Deactivate/reactivate a TLA and/or move them to a different department.
// user_role is intentionally not accepted here — only /api/admin/users/:id
// (admin-only) can change a role.

router.patch('/manager/tlas/:id', requireManager, async (req, res) => {
  const { id } = req.params;
  const { user_status, department_id } = req.body;

  if (user_status && !VALID_STATUSES.includes(user_status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const fields = [];
  const values = [];

  if (user_status   !== undefined) { fields.push('user_status = ?');   values.push(user_status);          }
  if (department_id !== undefined) { fields.push('department_id = ?'); values.push(department_id ?? null); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

  try {
    if (department_id !== undefined && department_id !== null) {
      const [dept] = await pool.query(
        'SELECT department_id FROM department WHERE department_id = ?',
        [department_id]
      );
      if (dept.length === 0) return res.status(404).json({ error: 'Department not found.' });
    }

    values.push(id);

    // WHERE clause requires user_role = 'tla' so this can never silently
    // patch an end_user/mss_manager/admin row even if the wrong id is passed.
    const [result] = await pool.query(
      `UPDATE user SET ${fields.join(', ')} WHERE user_id = ? AND user_role = 'tla'`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'TLA not found.' });
    }

    const [rows] = await pool.query(`
      SELECT
        u.user_id, u.user_name, u.user_email,
        u.user_status, u.department_id,
        d.department_name,
        u.created_at, u.updated_at
      FROM user u
      LEFT JOIN department d ON u.department_id = d.department_id
      WHERE u.user_id = ?
    `, [id]);

    return res.status(200).json({ message: 'TLA updated.', tla: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// Manage Categories
// Create/Update: Admin only. Read: All authenticated users (see /api/categories
// for the public read endpoint used during ticket creation — these admin
// endpoints return the same rows plus department_name for the management UI).
// ══════════════════════════════════════════════════════════════════════════

// ─── GET /api/admin/categories ────────────────────────────────────────────────
// Admin-facing read: includes department_name and a ticket_count so admins can
// see impact before editing. Kept separate from the public GET /api/categories
// (used during ticket creation) which stays lightweight.

router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.category_id, c.category_name, c.department_id,
        d.department_name,
        c.created_at,
        (SELECT COUNT(*) FROM ticket t WHERE t.category_id = c.category_id) AS ticket_count
      FROM category c
      LEFT JOIN department d ON c.department_id = d.department_id
      ORDER BY c.category_name
    `);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/admin/categories ───────────────────────────────────────────────
// Admin adds a new ticket category and links it to a department.
// department_id may be null — that represents "Other" / unrouted-by-design,
// which the system already treats as manual-assignment territory.

router.post('/categories', requireAdmin, async (req, res) => {
  const { category_name, department_id } = req.body;

  if (!category_name || !category_name.trim()) {
    return res.status(400).json({ error: 'category_name is required.' });
  }

  try {
    if (department_id !== undefined && department_id !== null) {
      const [dept] = await pool.query(
        'SELECT department_id FROM department WHERE department_id = ?',
        [department_id]
      );
      if (dept.length === 0) return res.status(404).json({ error: 'Department not found.' });
    }

    const [result] = await pool.query(
      `INSERT INTO category (category_name, department_id) VALUES (?, ?)`,
      [category_name.trim(), department_id ?? null]
    );

    const [rows] = await pool.query(`
      SELECT
        c.category_id, c.category_name, c.department_id,
        d.department_name, c.created_at,
        0 AS ticket_count
      FROM category c
      LEFT JOIN department d ON c.department_id = d.department_id
      WHERE c.category_id = ?
    `, [result.insertId]);

    return res.status(201).json({ message: 'Category created.', category: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/admin/categories/:id ──────────────────────────────────────────
// Admin updates category name or its associated department.
// Note: this affects future routing only — existing tickets keep the
// category_id (and department_id) they were created with, so no backfill
// is performed here on purpose.

router.patch('/categories/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { category_name, department_id } = req.body;

  const fields = [];
  const values = [];

  if (category_name !== undefined) {
    if (!category_name.trim()) return res.status(400).json({ error: 'category_name cannot be empty.' });
    fields.push('category_name = ?');
    values.push(category_name.trim());
  }

  if (department_id !== undefined) {
    if (department_id !== null) {
      const [dept] = await pool.query(
        'SELECT department_id FROM department WHERE department_id = ?',
        [department_id]
      );
      if (dept.length === 0) return res.status(404).json({ error: 'Department not found.' });
    }
    fields.push('department_id = ?');
    values.push(department_id);
  }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE category SET ${fields.join(', ')} WHERE category_id = ?`,
      values
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found.' });

    const [rows] = await pool.query(`
      SELECT
        c.category_id, c.category_name, c.department_id,
        d.department_name, c.created_at,
        (SELECT COUNT(*) FROM ticket t WHERE t.category_id = c.category_id) AS ticket_count
      FROM category c
      LEFT JOIN department d ON c.department_id = d.department_id
      WHERE c.category_id = ?
    `, [id]);

    return res.status(200).json({ message: 'Category updated. This affects routing for future tickets only.', category: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with that name already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// Manage Departments
// Create/Update: Admin only. Read: Admin, MSS Manager.
// ══════════════════════════════════════════════════════════════════════════

// ─── GET /api/admin/departments ──────────────────────────────────────────────
// Admin and MSS Manager view all departments and their associated TLAs.
// (TLAs themselves only ever see their own department — enforced elsewhere,
// this endpoint is admin/manager-only.)

router.get('/departments', requireAdminOrManager, async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT department_id, department_name, department_status, created_at
      FROM department
      ORDER BY department_name
    `);

    const [tlas] = await pool.query(`
      SELECT user_id, user_name, user_email, department_id
      FROM user
      WHERE user_role = 'tla'
      ORDER BY user_name
    `);

    const withTlas = departments.map(d => ({
      ...d,
      tlas: tlas.filter(t => t.department_id === d.department_id),
    }));

    return res.status(200).json(withTlas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/admin/departments ─────────────────────────────────────────────
// Admin adds a new department to the system.

router.post('/departments', requireAdmin, async (req, res) => {
  const { department_name } = req.body;

  if (!department_name || !department_name.trim()) {
    return res.status(400).json({ error: 'department_name is required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO department (department_name, department_status) VALUES (?, 'active')`,
      [department_name.trim()]
    );

    const [rows] = await pool.query(
      `SELECT department_id, department_name, department_status, created_at
       FROM department WHERE department_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ message: 'Department created.', department: { ...rows[0], tlas: [] } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A department with that name already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── PATCH /api/admin/departments/:id ─────────────────────────────────────────
// Admin updates department name or status.
// department_status = 'inactive' disables routing to that department — the
// department row itself is never deleted, so linked categories/users are
// preserved (their FK is ON DELETE SET NULL only if the row is removed,
// which this route never does).

const VALID_DEPT_STATUSES = ['active', 'inactive'];

router.patch('/departments/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { department_name, department_status } = req.body;

  if (department_status && !VALID_DEPT_STATUSES.includes(department_status)) {
    return res.status(400).json({ error: 'Invalid department_status. Must be active or inactive.' });
  }

  const fields = [];
  const values = [];

  if (department_name !== undefined) {
    if (!department_name.trim()) return res.status(400).json({ error: 'department_name cannot be empty.' });
    fields.push('department_name = ?');
    values.push(department_name.trim());
  }

  if (department_status !== undefined) {
    fields.push('department_status = ?');
    values.push(department_status);
  }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE department SET ${fields.join(', ')} WHERE department_id = ?`,
      values
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Department not found.' });

    const [rows] = await pool.query(
      `SELECT department_id, department_name, department_status, created_at
       FROM department WHERE department_id = ?`,
      [id]
    );

    const [tlas] = await pool.query(
      `SELECT user_id, user_name, user_email, department_id FROM user WHERE department_id = ?`,
      [id]
    );

    return res.status(200).json({ message: 'Department updated.', department: { ...rows[0], tlas } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A department with that name already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;