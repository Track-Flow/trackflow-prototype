// ─── mockData.js — TrackFlow Prototype ───────────────────────────────────────
// All data is static. Replace with real API calls in production.

export const tfDepartments = [
  { id: 'it',    name: 'IT Support',       color: '#2ec8ff' },
  { id: 'fac',   name: 'Facilities',       color: '#ffb547' },
  { id: 'admin', name: 'Administration',   color: '#c084fc' },
  { id: 'lib',   name: 'Library Services', color: '#2bd48f' },
];

export const tfUsers = [
  { id: 1,  name: 'Lerato Mbeki',       role: 'tla',            dept: 'it',    color: '#2ec8ff', initials: 'LM' },
  { id: 2,  name: 'Sanele Dlamini',     role: 'tla',            dept: 'fac',   color: '#ffb547', initials: 'SD' },
  { id: 3,  name: 'Nadia Fisher',       role: 'tla',            dept: 'it',    color: '#2bd48f', initials: 'NF' },
  { id: 4,  name: 'Kabelo Sithole',     role: 'tla',            dept: 'admin', color: '#c084fc', initials: 'KS' },
  { id: 5,  name: 'Aisha Patel',        role: 'tla',            dept: 'lib',   color: '#ff6b6b', initials: 'AP' },
  { id: 6,  name: 'Marco Rossi',        role: 'tla',            dept: 'it',    color: '#6fdcff', initials: 'MR' },
  { id: 7,  name: 'Dr. Priya Naidoo',   role: 'mss_manager',    dept: null,    color: '#ff9bd0', initials: 'PN' },
  { id: 8,  name: 'Tariq Adams',        role: 'helpdesk_admin', dept: null,    color: '#8fe7ff', initials: 'TA' },
  { id: 9,  name: 'Thando Khumalo',     role: 'end_user',       dept: null,    sub: 'Student · BSc CS, 3rd yr', color: '#6fdcff', initials: 'TK' },
  { id: 10, name: 'Prof. James Okonkwo',role: 'end_user',       dept: null,    sub: 'Lecturer · School of EIE', color: '#ffb547', initials: 'JO' },
  { id: 11, name: 'Devon Naidoo',       role: 'end_user',       dept: null,    sub: 'Student · BSc IT, 2nd yr', color: '#c084fc', initials: 'DN' },
  { id: 12, name: 'Busi Moeketsi',      role: 'end_user',       dept: null,    sub: 'Postgrad · MSc Eng',       color: '#2bd48f', initials: 'BM' },
];

export const ROLE_PERSONAS = [
  { role: 'end_user',       label: 'End User',    userId: 9,  accent: '#6fdcff' },
  { role: 'tla',            label: 'TLA',         userId: 1,  accent: '#2ec8ff' },
  { role: 'mss_manager',    label: 'MSS Manager', userId: 7,  accent: '#ff9bd0' },
  { role: 'helpdesk_admin', label: 'Help Desk',   userId: 8,  accent: '#ffb547' },
];

export const tfCategories = ['IT Support', 'Facilities', 'Administration', 'Library Services', 'Other'];



export const tfStatuses = [
  { key: 'unrouted',    label: 'Unrouted',    color: '#ff9bd0' },
  { key: 'open',        label: 'Open',        color: '#2ec8ff' },
  { key: 'in_progress', label: 'In Progress', color: '#ffb547' },
  { key: 'pending',     label: 'Pending',     color: '#c084fc' },
  { key: 'resolved',    label: 'Resolved',    color: '#2bd48f' },
  { key: 'closed',      label: 'Closed',      color: '#3a4f6a' },
];

export const tfTickets = [
  { id: 'TF-1842', title: 'VPN disconnecting every 15 minutes',      category: 'IT Support',       dept: 'it',      status: 'in_progress', requesterId: 9,  assigneeId: 1,  createdAt: '2025-04-22T08:00:00Z', updatedAt: '2025-04-22T10:00:00Z', description: 'VPN drops every 15 minutes exactly. Happening since yesterday. Using GlobalProtect on Windows 11.' },
  { id: 'TF-1837', title: 'Library wing aircon broken',               category: 'Facilities',       dept: 'fac',   status: 'in_progress', requesterId: 9,  assigneeId: 2,  createdAt: '2025-04-22T06:00:00Z', updatedAt: '2025-04-22T08:00:00Z', description: 'The air conditioning in the West Wing of the library is not working. Very hot, affecting students.' },
  { id: 'TF-1834', title: 'Lost student card — replacement?',          category: 'Other',            dept: null,        status: 'unrouted',    requesterId: 9,  assigneeId: null, createdAt: '2025-04-22T07:00:00Z', updatedAt: '2025-04-22T09:00:00Z', description: 'I lost my student card and need a replacement. Not sure which department handles this.' },
  { id: 'TF-1829', title: 'Projector in DH204 flickering',            category: 'IT Support',       dept: 'it',    status: 'open',        requesterId: 10, assigneeId: null, createdAt: '2025-04-21T14:00:00Z', updatedAt: '2025-04-21T14:00:00Z', description: 'The projector in lecture hall DH204 flickers constantly during presentations.' },
  { id: 'TF-1821', title: 'Cannot access Moodle gradebook',           category: 'IT Support',       dept: 'it',    status: 'open',        requesterId: 11, assigneeId: null, createdAt: '2025-04-21T10:00:00Z', updatedAt: '2025-04-21T10:00:00Z', description: 'Gradebook throws a 403 error when I try to view it as a lecturer.' },
  { id: 'TF-1815', title: 'Bathroom tap leaking in MSL building',     category: 'Facilities',       dept: 'fac',   status: 'pending',     requesterId: 12, assigneeId: 2,  createdAt: '2025-04-20T09:00:00Z', updatedAt: '2025-04-21T08:00:00Z', description: 'The tap in the 2nd floor bathroom of MSL has been leaking for 3 days.' },
  { id: 'TF-1809', title: 'Library book not showing in catalogue',    category: 'Library Services', dept: 'lib',   status: 'resolved',    requesterId: 9,  assigneeId: 5,  createdAt: '2025-04-19T11:00:00Z', updatedAt: '2025-04-20T14:00:00Z', description: 'A textbook I need for my course is not showing up in the library catalogue.' },
  { id: 'TF-1801', title: 'Staff email alias not working',            category: 'Administration',   dept: 'admin', status: 'resolved',    requesterId: 10, assigneeId: 4,  createdAt: '2025-04-18T08:00:00Z', updatedAt: '2025-04-19T10:00:00Z', description: 'My staff email alias (first.last@wits.ac.za) is bouncing. The primary address works.' },
  { id: 'TF-1790', title: 'Broken chair in Tutorial Room 3',          category: 'Facilities',       dept: 'fac',     status: 'closed',      requesterId: 12, assigneeId: 2,  createdAt: '2025-04-15T13:00:00Z', updatedAt: '2025-04-16T10:00:00Z', description: 'One of the chairs in Tutorial Room 3 has a broken leg — safety hazard.' },
  { id: 'TF-1785', title: 'Software licence expired — MATLAB',        category: 'IT Support',       dept: 'it',     status: 'resolved',    requesterId: 10, assigneeId: 1,  createdAt: '2025-04-14T07:00:00Z', updatedAt: '2025-04-15T10:00:00Z', description: 'MATLAB licence has expired across the entire School of EIE. Labs are affected.' },
  { id: 'TF-1784', title: 'Postgrad registration block',              category: 'Administration',   dept: 'admin',  status: 'resolved',    requesterId: 12, assigneeId: 4,  createdAt: '2025-04-13T09:00:00Z', updatedAt: '2025-04-14T11:00:00Z', description: 'There is a financial block on my account preventing me from registering for next semester.' },
  // Unrouted tickets for helpdesk
  { id: 'TF-1843', title: 'Parking permit renewal process?',          category: 'Other',            dept: null,       status: 'unrouted',    requesterId: 11, assigneeId: null, createdAt: '2025-04-22T11:00:00Z', updatedAt: '2025-04-22T11:00:00Z', description: 'How do I renew my parking permit for the new semester?' },
  { id: 'TF-1844', title: 'Noise complaint — study area',             category: 'Other',            dept: null,  status: 'unrouted',    requesterId: 10, assigneeId: null, createdAt: '2025-04-22T12:00:00Z', updatedAt: '2025-04-22T12:00:00Z', description: 'Group of students are consistently loud in the designated quiet study area.' },
];

// Kanban board cards for TLA board view
export const tfBoardCards = [
  { id: 'TF-1829', column: 'open',        title: 'Projector in DH204 flickering',        assignees: [],  dept: 'it',    due: 'Today'   },
  { id: 'TF-1821', column: 'open',        title: 'Cannot access Moodle gradebook',        assignees: [],  dept: 'it',    due: 'Today'   },
  { id: 'TF-1842', column: 'in_progress', title: 'VPN disconnecting every 15 minutes',   assignees: [1], dept: 'it',    due: 'Apr 23'  },
  { id: 'TF-1837', column: 'in_progress', title: 'Library wing aircon broken',            assignees: [2], dept: 'fac',   due: 'Apr 24'  },
  { id: 'TF-1815', column: 'pending',     title: 'Bathroom tap leaking in MSL',         assignees: [2], dept: 'fac',   due: 'Apr 25'  },
  { id: 'TF-1809', column: 'resolved',    title: 'Library book not showing in catalogue',    assignees: [5], dept: 'lib',   due: '—'       },
  { id: 'TF-1798', column: 'resolved',    title: 'Wi-Fi dead spots in Wartenweiler',     assignees: [3], dept: 'it',    due: '—'       },
];

// Trend data for manager reports
export const tfTrend = [
  { d: 'Apr 6',  open: 12, resolved: 8  },
  { d: 'Apr 7',  open: 15, resolved: 11 },
  { d: 'Apr 8',  open: 9,  resolved: 14 },
  { d: 'Apr 9',  open: 18, resolved: 10 },
  { d: 'Apr 10', open: 22, resolved: 16 },
  { d: 'Apr 11', open: 14, resolved: 18 },
  { d: 'Apr 12', open: 11, resolved: 15 },
  { d: 'Apr 13', open: 19, resolved: 13 },
  { d: 'Apr 14', open: 25, resolved: 20 },
  { d: 'Apr 15', open: 17, resolved: 22 },
  { d: 'Apr 16', open: 21, resolved: 19 },
  { d: 'Apr 17', open: 23, resolved: 17 },
  { d: 'Apr 18', open: 16, resolved: 21 },
  { d: 'Apr 19', open: 28, resolved: 12 },
];

export const tfSlaCompliance = [
  { dept: 'IT Support',       target: 90, actual: 87 },
  { dept: 'Facilities',       target: 85, actual: 91 },
  { dept: 'Administration',   target: 80, actual: 94 },
  { dept: 'Library Services', target: 85, actual: 82 },
];

export const tfTlaWorkload = [
  { name: 'Lerato Mbeki',   active: 4, resolvedWk: 12, sla: 87, dept: 'IT Support'       },
  { name: 'Nadia Fisher',   active: 2, resolvedWk: 9,  sla: 92, dept: 'IT Support'       },
  { name: 'Marco Rossi',    active: 3, resolvedWk: 8,  sla: 79, dept: 'IT Support'       },
  { name: 'Sanele Dlamini', active: 2, resolvedWk: 11, sla: 95, dept: 'Facilities'       },
  { name: 'Kabelo Sithole', active: 3, resolvedWk: 7,  sla: 88, dept: 'Administration'   },
  { name: 'Aisha Patel',    active: 1, resolvedWk: 6,  sla: 100,dept: 'Library Services' },
];

export const tfDeptLoad = [
  { name: 'IT Support',       open: 4, resolved: 8, breach: 1, color: '#2ec8ff' },
  { name: 'Facilities',       open: 2, resolved: 3, breach: 0, color: '#ffb547' },
  { name: 'Administration',   open: 1, resolved: 2, breach: 0, color: '#c084fc' },
  { name: 'Library Services', open: 1, resolved: 1, breach: 0, color: '#2bd48f' },
];

export const tfActivity = [
  { kind: 'created',  who: 'Thando Khumalo',  text: 'created TF-1842 · VPN disconnecting every 15 minutes',  when: '2h ago'  },
  { kind: 'route',    who: 'Tariq Adams',      text: 'routed TF-1834 → pending manual assignment',             when: '1h ago'  },
  { kind: 'status',   who: 'Lerato Mbeki',     text: 'moved TF-1842 to In Progress',                           when: '2h ago'  },
  { kind: 'comment',  who: 'Sanele Dlamini',   text: 'commented on TF-1837: "Parts ordered, ETA Thu."',        when: '38m ago' },
  { kind: 'assigned', who: 'Nadia Fisher',     text: 'was assigned TF-1821',                                   when: '4h ago'  },
  { kind: 'resolved', who: 'Lerato Mbeki',     text: 'resolved TF-1785 · Software licence expired — MATLAB',   when: '2d ago'  },
];

// Helper functions

export function getStatus(key) {
  return tfStatuses.find(s => s.key === key) ?? { label: key, color: '#8fa2c0' };
}
export function getUser(id) {
  return tfUsers.find(u => u.id === id) ?? null;
}
export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}