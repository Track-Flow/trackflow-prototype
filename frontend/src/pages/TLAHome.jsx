import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Button, Avatar, Chip, Divider,
} from '@mui/material';
import { tfTickets, tfUsers, tfActivity, getStatus, timeAgo, getUser } from '../data/mockData';

const ACCENT     = '#2ec8ff';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';

// TLA is Lerato Mbeki (id 1), dept: 'it'
const TLA_USER   = tfUsers.find(u => u.id === 1);
const DEPT_TICKETS = tfTickets.filter(t => t.dept === 'it');

const FILTERS = [
  { key: 'all',        label: 'All active' },
  { key: 'mine',       label: 'Assigned to me' },
  { key: 'unassigned', label: 'Unassigned' },
];

function KpiCard({ label, value, color, sub }) {
  return (
    <Card sx={{ flex: '1 1 140px', p: 2.5 }}>
      <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 30, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: TEXT_DIM, mt: 0.5 }}>{sub}</Typography>}
    </Card>
  );
}

function TicketRow({ ticket, onClaim, onStart, onResolve }) {
  const s          = getStatus(ticket.status);
  const assignee   = ticket.assigneeId ? getUser(ticket.assigneeId) : null;
  const isAssignedToMe = ticket.assigneeId === 1;
  const navigate   = useNavigate();

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      py: 1.75, borderBottom: `1px solid ${BORDER}`,
      '&:last-child': { borderBottom: 'none' },
    }}>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2' }}>{ticket.id}</Typography>
          <Chip label={s.label} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}33` }} />
        </Box>
        <Typography
          onClick={() => navigate(`/tickets/${ticket.id}`)}
          sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, cursor: 'pointer', '&:hover': { color: ACCENT } }}
          noWrap
        >
          {ticket.title}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: TEXT_DIM, mt: 0.2 }}>
          {timeAgo(ticket.updatedAt)}
          {assignee
            ? <span> · <span style={{ color: '#6fdcff' }}>↗ {assignee.name}</span></span>
            : <span style={{ color: '#ffb547' }}> · Unassigned</span>
          }
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {!ticket.assigneeId && (
          <Button size="small" variant="contained" onClick={() => onClaim(ticket.id)}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 13 }}>person_add</span>}
            sx={{ fontSize: 11, py: 0.5, px: 1.5 }}>
            Claim
          </Button>
        )}
        {isAssignedToMe && ticket.status === 'open' && (
          <Button size="small" variant="outlined" onClick={() => onStart(ticket.id)}
            sx={{ fontSize: 11, py: 0.5, borderColor: '#ffb547', color: '#ffb547', '&:hover': { borderColor: '#ffb547', bgcolor: 'rgba(255,181,71,0.08)' } }}>
            Start
          </Button>
        )}
        {isAssignedToMe && ticket.status === 'in_progress' && (
          <Button size="small" variant="outlined" onClick={() => onResolve(ticket.id)}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>}
            sx={{ fontSize: 11, py: 0.5, borderColor: '#2bd48f', color: '#2bd48f', '&:hover': { borderColor: '#2bd48f', bgcolor: 'rgba(43,212,143,0.08)' } }}>
            Resolve
          </Button>
        )}
      </Box>
    </Box>
  );
}

function ActivityItem({ item }) {
  const iconMap = {
    created:  { icon: 'add_circle',  color: '#2ec8ff' },
    route:    { icon: 'alt_route',   color: '#ff9bd0' },
    status:   { icon: 'sync',        color: '#ffb547' },
    comment:  { icon: 'chat',        color: '#c084fc' },
    assigned: { icon: 'person_add',  color: '#6fdcff' },
    resolved: { icon: 'check_circle',color: '#2bd48f' },
  };
  const meta = iconMap[item.kind] ?? { icon: 'info', color: '#8fa2c0' };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        bgcolor: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: meta.color, fontVariationSettings: "'FILL' 1" }}>
          {meta.icon}
        </span>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, color: TEXT_BRIGHT, lineHeight: 1.5 }}>
          <strong>{item.who}</strong> {item.text}
        </Typography>
        <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{item.when}</Typography>
      </Box>
    </Box>
  );
}

export default function TLAHome({ extraTickets = [] }) {
  const navigate = useNavigate();

  const allDeptTickets = [
    ...extraTickets.filter(t => t.dept === 'it'),
    ...DEPT_TICKETS,
  ];

  const [tickets, setTickets] = useState(allDeptTickets.filter(t => !['resolved', 'closed'].includes(t.status)));
  const [filter, setFilter]   = useState('all');

  function handleClaim(id) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, assigneeId: 1, status: 'open' } : t));
  }
  function handleStart(id) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'in_progress' } : t));
  }
  function handleResolve(id) {
    setTickets(prev => prev.filter(t => t.id !== id));
  }

  const displayed = tickets.filter(t => {
    if (filter === 'mine')       return t.assigneeId === 1;
    if (filter === 'unassigned') return !t.assigneeId;
    return true;
  });

  const myActive   = tickets.filter(t => t.assigneeId === 1).length;
  const unassigned = tickets.filter(t => !t.assigneeId).length;
  const resolvedWk = 12; // static for prototype

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          IT Support · TLA
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>
          Welcome back, {TLA_USER?.name.split(' ')[0]}
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard label="My active"    value={myActive}   color={ACCENT}     />
        <KpiCard label="Unassigned"   value={unassigned} color="#ffb547"    sub={unassigned > 0 ? 'Needs attention' : 'All clear'} />
        <KpiCard label="Resolved wk"  value={resolvedWk} color="#2bd48f"   />
        <KpiCard label="SLA rate"     value="87%"        color="#c084fc"    />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Ticket queue */}
        <Card sx={{ flex: '1 1 480px', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>
              IT Support queue
            </Typography>
            <Button size="small" onClick={() => navigate('/tla/board')}
              endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>view_kanban</span>}
              sx={{ fontSize: 11, color: ACCENT }}>
              Board view
            </Button>
          </Box>

          {/* Filter tabs */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
            {FILTERS.map(f => (
              <Button key={f.key} size="small" onClick={() => setFilter(f.key)}
                sx={{
                  fontSize: 11, py: 0.4, px: 1.25, borderRadius: 1.5,
                  fontWeight: filter === f.key ? 700 : 400,
                  color: filter === f.key ? ACCENT : TEXT_DIM,
                  bgcolor: filter === f.key ? `${ACCENT}15` : 'transparent',
                }}>
                {f.label}
              </Button>
            ))}
          </Box>

          {displayed.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: TEXT_DIM, display: 'block', marginBottom: 8 }}>done_all</span>
              <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>Queue is clear!</Typography>
            </Box>
          ) : (
            displayed.map(t => (
              <TicketRow key={t.id} ticket={t}
                onClaim={handleClaim}
                onStart={handleStart}
                onResolve={handleResolve}
              />
            ))
          )}
        </Card>

        {/* Activity feed */}
        <Card sx={{ flex: '0 1 300px', p: 3 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT, mb: 2 }}>
            Team pulse
          </Typography>
          {tfActivity.map((item, i) => <ActivityItem key={i} item={item} />)}
        </Card>

      </Box>
    </Box>
  );
}