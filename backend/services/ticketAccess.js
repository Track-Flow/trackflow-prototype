// ─── ticketAccess.js ──────────────────────────────────────────────────────────
// Single source of truth for who may see or change a ticket. Every ticket
// route goes through these helpers so the rules live in the API, not only in
// the screens (System Test Documentation §9.2, Priority 1 and 2).
//
// Visibility (UC02 A3, UC06 step 2 / A3):
//   admin        → every ticket
//   mss_manager  → own department + "Other" tickets (department_id NULL)
//                  Exceptions: reports (GET /tickets/reports) and opening a
//                  single ticket read-only from a report drill-down.
//   tla          → own department + "Other" tickets
//   end_user     → only tickets they logged
//
// Workflow (UC05 step 4 / A1 / A4):
//   open → in_progress → struggling ⇄ in_progress → resolved → closed
//   in_progress / struggling may go back to open (unclaim / hand back)
//   resolved and closed are locked; only resolved → closed is allowed here,
//   everything else goes through POST /:id/reopen.

const pool = require('../config/db');

const VALID_STATUSES = ['open', 'in_progress', 'struggling', 'resolved', 'closed'];

const ALLOWED_TRANSITIONS = {
  open:        ['in_progress'],
  in_progress: ['open', 'struggling', 'resolved'],
  struggling:  ['open', 'in_progress', 'resolved'],
  resolved:    ['closed'],
  closed:      [],
};

// Statuses that only make sense once somebody owns the ticket.
const NEEDS_ASSIGNEE = ['in_progress', 'struggling', 'resolved'];

const LOCKED_STATUSES = ['resolved', 'closed'];

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

// Re-read role and department from the DB so a department change by an admin
// takes effect immediately instead of waiting for the JWT to expire.
async function resolveUser(reqUser, db = pool) {
  try {
    const [[row]] = await db.query(
      'SELECT user_id, user_role, department_id FROM user WHERE user_id = ?',
      [reqUser.id]
    );
    if (row) {
      return { id: row.user_id, role: row.user_role, department_id: row.department_id };
    }
  } catch (err) {
    console.error('resolveUser failed, falling back to JWT claims:', err);
  }
  return { id: reqUser.id, role: reqUser.role, department_id: reqUser.department_id ?? null };
}

// SQL fragment + params restricting a ticket query (alias `t`) to what `user` may see.
function scopeClause(user, alias = 't') {
  const a = alias;
  switch (user.role) {
    case 'admin':
      return { sql: '1 = 1', params: [] };
    case 'mss_manager':
      return user.department_id != null
        ? { sql: `(${a}.department_id = ? OR ${a}.department_id IS NULL)`, params: [user.department_id] }
        : { sql: `${a}.department_id IS NULL`, params: [] };
    case 'tla':
      return user.department_id != null
        ? { sql: `(${a}.department_id = ? OR ${a}.department_id IS NULL)`, params: [user.department_id] }
        : { sql: `${a}.department_id IS NULL`, params: [] };
    case 'end_user':
      return { sql: `${a}.user_id = ?`, params: [user.id] };
    default:
      return { sql: '1 = 0', params: [] };
  }
}

// Same rules as scopeClause, for a ticket row already in memory.
function canViewTicket(user, ticket) {
  if (!ticket) return false;
  const inScopeDept = ticket.department_id == null ||
    (user.department_id != null && sameId(ticket.department_id, user.department_id));
  switch (user.role) {
    case 'admin':
      return true;
    case 'mss_manager':
    case 'tla':
      return inScopeDept;
    case 'end_user':
      return sameId(ticket.user_id, user.id);
    default:
      return false;
  }
}

// Read access to a single ticket (detail page, history, attachment).
// Same as canViewTicket except managers may open any department's ticket,
// because reports analyse every department and their drill-downs link to
// individual tickets. This is read-only: changes still use canViewTicket /
// canModifyTicket, which keep managers to their own department.
function canOpenTicket(user, ticket) {
  if (!ticket) return false;
  if (user.role === 'mss_manager') return true;
  return canViewTicket(user, ticket);
}

// A TLA may only self-claim an open ticket in their own department or an
// "Other" ticket (UC04 A2).
function canTlaClaim(user, ticket) {
  if (ticket.department_id == null) return true;
  return user.department_id != null && sameId(ticket.department_id, user.department_id);
}

// Only the assigned TLA, or a manager/admin with the ticket in scope, may
// change a ticket (UC05 A3).
function canModifyTicket(user, ticket, effectiveAssigneeId) {
  if (user.role === 'admin') return true;
  if (user.role === 'mss_manager') return canViewTicket(user, ticket);
  if (user.role === 'tla') return sameId(effectiveAssigneeId, user.id);
  return false;
}

// Returns null when the move is fine, otherwise { status, error }.
function checkTransition(fromStatus, toStatus, { hasAssignee, resolutionNote }) {
  if (!VALID_STATUSES.includes(toStatus)) {
    return { status: 400, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` };
  }
  if (fromStatus === toStatus) return null;

  if (LOCKED_STATUSES.includes(fromStatus) && !(fromStatus === 'resolved' && toStatus === 'closed')) {
    return {
      status: 409,
      error: `This ticket is ${fromStatus} and can no longer be updated this way. Use the reopen action instead.`,
    };
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    return {
      status: 400,
      error: `Cannot move a ticket from ${fromStatus} to ${toStatus}. Allowed next steps: ${allowed.join(', ') || 'none'}.`,
    };
  }

  if (NEEDS_ASSIGNEE.includes(toStatus) && !hasAssignee) {
    return { status: 400, error: 'This ticket must be claimed by a TLA before its status can change.' };
  }

  if (toStatus === 'resolved' && !(typeof resolutionNote === 'string' && resolutionNote.trim())) {
    return { status: 400, error: 'A resolution note is required before resolving this ticket.' };
  }

  return null;
}

module.exports = {
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
  LOCKED_STATUSES,
  sameId,
  resolveUser,
  scopeClause,
  canViewTicket,
  canOpenTicket,
  canTlaClaim,
  canModifyTicket,
  checkTransition,
};