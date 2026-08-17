const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',   // Vite dev
  'https://localhost',        // nginx HTTPS
  'http://localhost',         // nginx HTTP (before redirect)
];

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl / mobile (no origin header)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie'],
}));

app.use(express.json());

const ticketRoutes = require('./routes/ticket');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const categoriesRoutes = require('./routes/categories');

const { authenticateToken } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/categories', authenticateToken, categoriesRoutes);

// Delete the second app.use(cors(...)) block entirely.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});