const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const dotenv = require("dotenv");

dotenv.config();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { user_id, user_name, user_email, password } = req.body;

  if (!user_id || !user_name || !user_email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO user (user_id, user_name, user_email, user_password_hash, user_role) VALUES (?, ?, ?, ?, ?)",
      [user_id, user_name, user_email, hashedPassword, "end_user"],
    );

    return res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "User already exists." });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  if (!user_id || !password) {
    return res
      .status(400)
      .json({ error: "User ID and password are required." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM user WHERE user_id = ?", [
      user_id,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(
      password,
      user.user_password_hash,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        role: user.user_role,
        department_id: user.department_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.user_email,
        role: user.user_role,
        department_id: user.department_id, 
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
