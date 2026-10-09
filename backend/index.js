const http = require('http');
const express = require('express');
const cors = require('cors');
const realtime = require('./services/realtime.js');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',   // Vite dev
  'https://localhost',        // nginx HTTPS
  'http://localhost',         // nginx HTTPZZ (before redirect)
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
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notifications');

const { authenticateToken } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/categories', authenticateToken, categoriesRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Last-resort error handler: anything that reaches here (bad JSON body,
// unexpected throw) comes back as clean JSON, never Express's HTML stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
});

// One HTTP server for both Express and Socket.io (live board updates).
// Nginx proxies /api/ and /socket.io/ to the same backend port.
function createServer() {
  const server = http.createServer(app);
  realtime.init(server, { corsOrigins: allowedOrigins });
  return server;
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  createServer().listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (REST + Socket.io)`);
  });
}

module.exports = app;
module.exports.createServer = createServer;