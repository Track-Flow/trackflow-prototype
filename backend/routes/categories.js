const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/categories
// Returns each category with the real department it routes to.
// "Other" has no department (visible to all) and is sorted last.
// Categories pointing at inactive departments are hidden.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.category_id,
             c.category_name,
             c.department_id,
             d.department_name
      FROM category c
      LEFT JOIN department d ON d.department_id = c.department_id
      WHERE c.department_id IS NULL
         OR d.department_status = 'active'
      ORDER BY (LOWER(c.category_name) = 'other'), c.category_name
    `);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;