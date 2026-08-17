const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // or your Vercel URL
  credentials: true,
}));
app.use(express.json());

const ticketRoutes = require('./routes/ticket');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const categoriesRoutes = require('./routes/categories');

const { authenticateToken } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/tickets',authenticateToken, ticketRoutes);
app.use('/api/admin',authenticateToken, adminRoutes);
app.use('/api/categories', authenticateToken, categoriesRoutes);


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});