const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT category_id, category_name, department_id
      FROM category
      ORDER BY category_name
    `);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;