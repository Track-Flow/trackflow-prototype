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


/**
 * SLA compliance per department over a trailing window.
 * A ticket meets SLA if resolved within `slaHours` of creation.
 * An unresolved ticket older than `slaHours` counts as a breach.
 * Tickets still open and younger than `slaHours` are excluded (not yet due).
 * Returns one row per department, each carrying its own filtered ticket list
 * so chart click-throughs don't need to re-filter.
 */
export function getSlaComplianceByDept(tickets, { windowDays = 30, slaHours = 24, target = 90 } = {}) {
  const cutoff = Date.now() - windowDays * 86400000;
  const inWindow = tickets.filter(t => t.ticket_created_at && new Date(t.ticket_created_at).getTime() >= cutoff);

  const byDept = {};
  for (const t of inWindow) {
    const dept = t.department_name ?? 'Unrouted';
    if (!byDept[dept]) byDept[dept] = { dept, tickets: [], met: 0, breached: 0 };
    byDept[dept].tickets.push(t);

    const created = new Date(t.ticket_created_at).getTime();
    const resolved = t.resolved_at ? new Date(t.resolved_at).getTime() : null;
    const ageHours = (Date.now() - created) / 3600000;

    if (resolved !== null) {
      const resHours = (resolved - created) / 3600000;
      resHours <= slaHours ? byDept[dept].met++ : byDept[dept].breached++;
    } else if (ageHours > slaHours) {
      byDept[dept].breached++;
    }
    // else: still open, not yet due — excluded from both counts
  }

  return Object.values(byDept)
    .map(d => {
      const decided = d.met + d.breached;
      const actualPct = decided > 0 ? Math.round((d.met / decided) * 100) : 100;
      return { dept: d.dept, target, actual: actualPct, met: d.met, breached: d.breached, tickets: d.tickets };
    })
    .sort((a, b) => a.dept.localeCompare(b.dept));
}

/** Resolution time in hours for a single ticket, or null if unresolved. */
export function getResolutionHours(ticket) {
  if (!ticket.resolved_at || !ticket.ticket_created_at) return null;
  return (new Date(ticket.resolved_at).getTime() - new Date(ticket.ticket_created_at).getTime()) / 3600000;
}

/** Whether a single ticket breaches the given SLA window (resolved late, or still open past due). */
export function isSlaBreached(ticket, slaHours = 24) {
  const created = new Date(ticket.ticket_created_at).getTime();
  if (ticket.resolved_at) {
    return (new Date(ticket.resolved_at).getTime() - created) / 3600000 > slaHours;
  }
  return (Date.now() - created) / 3600000 > slaHours;
}

/** Group tickets by the calendar date (YYYY-MM-DD) they were created/resolved, for trend drill-down. */
export function groupTicketsByDate(tickets, dateField = 'ticket_created_at') {
  const byDate = {};
  for (const t of tickets) {
    if (!t[dateField]) continue;
    const key = new Date(t[dateField]).toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(t);
  }
  return byDate;
}

/** Group tickets by assignee, for TLA workload drill-down. */
export function groupTicketsByAssignee(tickets) {
  const byAssignee = {};
  for (const t of tickets) {
    if (!t.assigned_user_id) continue;
    const key = t.assigned_user_id;
    if (!byAssignee[key]) {
      byAssignee[key] = { id: key, name: t.assignee_name ?? key, dept: t.department_name ?? 'Unrouted', tickets: [] };
    }
    byAssignee[key].tickets.push(t);
  }
  return Object.values(byAssignee).map(a => ({
    ...a,
    active: a.tickets.filter(t => ['open', 'in_progress', 'struggling'].includes(t.ticket_status)).length,
    resolved: a.tickets.filter(t => t.ticket_status === 'resolved' || t.ticket_status === 'closed').length,
  }));
}

/** Group tickets by department, for volume-breakdown drill-down. */
export function groupTicketsByDept(tickets) {
  const byDept = {};
  for (const t of tickets) {
    const key = t.department_name ?? 'Unrouted';
    if (!byDept[key]) byDept[key] = { name: key, tickets: [] };
    byDept[key].tickets.push(t);
  }
  return Object.values(byDept).map(d => ({
    ...d,
    open: d.tickets.filter(t => !['resolved', 'closed'].includes(t.ticket_status)).length,
    resolved: d.tickets.filter(t => ['resolved', 'closed'].includes(t.ticket_status)).length,
  }));
}