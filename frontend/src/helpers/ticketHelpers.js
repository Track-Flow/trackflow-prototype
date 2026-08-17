// ─── Filtering ────────────────────────────────────────────────────────────────

/** Tickets assigned to a specific user */
export function getMyTickets(tickets, userId) {
  return tickets.filter(t => t.assignee_id === userId);
}

/** Open tickets with no assignee — available to claim */
export function getUnassigned(tickets) {
  return tickets.filter(t => t.ticket_status === 'open' && !t.assignee_id);
}

/** Tickets with no department (unrouted "Other" tickets) */
export function getUnrouted(tickets) {
  return tickets.filter(t => !t.department_id);
}

/** Tickets belonging to a specific user (requester) */
export function getUserTickets(tickets, userId) {
  return tickets.filter(t => t.user_id === userId);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Count tickets grouped by status
 * Returns e.g. { open: 4, in_progress: 2, resolved: 10, ... }
 */
export function countByStatus(tickets) {
  return tickets.reduce((acc, t) => {
    const s = t.ticket_status ?? 'unknown';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Tickets that have breached SLA
 * Assumes ticket has a `sla_deadline` datetime field
 */
export function getSLABreaches(tickets) {
  const now = new Date();
  return tickets.filter(t => {
    if (!t.sla_deadline) return false;
    return new Date(t.sla_deadline) < now && t.ticket_status !== 'resolved' && t.ticket_status !== 'closed';
  });
}

/**
 * Tickets resolved today
 */
export function getResolvedToday(tickets) {
  const today = new Date().toDateString();
  return tickets.filter(t =>
    t.ticket_status === 'resolved' &&
    t.updated_at &&
    new Date(t.updated_at).toDateString() === today
  );
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Map status key → display label + color */
export function statusMeta(status) {
  const map = {
    open:        { label: 'Open',        color: '#2ec8ff' },
    in_progress: { label: 'In Progress', color: '#ffb547' },
    pending:     { label: 'Pending',     color: '#c084fc' },
    resolved:    { label: 'Resolved',    color: '#2bd48f' },
    closed:      { label: 'Closed',      color: '#8fa2c0' },
    unrouted:    { label: 'Unrouted',    color: '#ff9bd0' },
  };
  return map[status] ?? { label: status, color: '#8fa2c0' };
}

/** Map priority key → display label + color */
export function priorityMeta(priority) {
  const map = {
    urgent: { label: 'Urgent', color: '#ff6b6b' },
    high:   { label: 'High',   color: '#ffb547' },
    medium: { label: 'Medium', color: '#6fdcff' },
    low:    { label: 'Low',    color: '#8fa2c0' },
  };
  return map[priority] ?? { label: priority, color: '#8fa2c0' };
}

/** Format a datetime string to a short relative label */
export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}