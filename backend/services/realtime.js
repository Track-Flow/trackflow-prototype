// ─── realtime.js ──────────────────────────────────────────────────────────────
// Live board updates over Socket.io (UC05 / UC06, TC-BOARD-M04).
//
// Design: the socket never carries ticket data. When a ticket changes, the
// server sends { ticket_id, action } to the rooms of everyone who is allowed to
// see that ticket, and their board refetches through GET /api/tickets — which
// is already scoped by role. So the socket can't leak anything the REST API
// wouldn't show, and the scoping rules live in one place (ticketAccess.js).
//
// Rooms a connected user joins:
//   user:<id>        always — owner/assignee updates for anyone
//   dept:<id>        TLAs and managers with a department
//   other            TLAs and managers — "Other" tickets (department_id NULL)
//   all              admins only — every ticket change
//
// If WebSockets are blocked on the network, Socket.io falls back to HTTP
// long-polling automatically; the client also polls every 15s while
// disconnected (UC06 A2).

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { resolveUser } = require('./ticketAccess');

let io = null;

function init(httpServer, { corsOrigins } = {}) {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: corsOrigins ? { origin: corsOrigins, credentials: true } : undefined,
  });

  // Same JWT as the REST API, sent in the handshake: io({ auth: { token } }).
  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.auth?.token || '';
      const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
      if (!token) return next(new Error('unauthorised'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await resolveUser(decoded);
      return next();
    } catch {
      return next(new Error('unauthorised'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.user;
    socket.join(`user:${u.id}`);
    if (u.role === 'admin') socket.join('all');
    if (u.role === 'tla' || u.role === 'mss_manager') {
      socket.join('other');
      if (u.department_id != null) socket.join(`dept:${u.department_id}`);
    }
  });

  return io;
}

/**
 * Tell everyone who can see this ticket that it changed.
 * @param {object} t        ticket row (needs ticket_id, department_id, user_id, assigned_user_id)
 * @param {string} action   e.g. 'created' | 'updated' | 'escalated' | 'flagged' | 'reopened'
 * @param {object} [opts]
 * @param {Array}  [opts.previousDepartmentIds]  departments it just left (flag-department)
 * @param {Array}  [opts.previousUserIds]        users who just lost it (e.g. unassigned TLA)
 */
function emitTicketChange(t, action = 'updated', opts = {}) {
  if (!io || !t) return;
  try {
    const rooms = new Set(['all']);
    const depts = [t.department_id, ...(opts.previousDepartmentIds || [])];
    for (const d of depts) rooms.add(d == null ? 'other' : `dept:${d}`);
    for (const uid of [t.user_id, t.assigned_user_id, ...(opts.previousUserIds || [])]) {
      if (uid != null) rooms.add(`user:${uid}`);
    }
    io.to([...rooms]).emit('ticket:changed', {
      ticket_id: Number(t.ticket_id),
      action,
      at: new Date().toISOString(),
    });
  } catch (err) {
    // Live updates are best-effort — never fail the request over them.
    console.error('emitTicketChange failed:', err);
  }
}

function close() {
  if (io) io.close();
  io = null;
}

module.exports = { init, emitTicketChange, close };