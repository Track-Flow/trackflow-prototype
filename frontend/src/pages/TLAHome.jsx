// ─── TLAHome.jsx ────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Button, Avatar, Chip,
  CircularProgress, Alert,
} from '@mui/material';
import api from '../helpers/api';
import { statusMeta, priorityMeta,timeAgo, getUnassigned, getSLABreaches } from '../helpers/ticketHelpers';

// ─── Theme tokens (prototype palette) ─────────────────────────────────────────
const ACCENT      = '#5a8dc4';
const PAPER       = '#111d2e';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function firstName(fullName) {
  if (!fullName) return '?';
  return fullName.split(' ')[0];
}

function sortByOldestFirst(list) {
  return [...list].sort((a, b) => new Date(a.ticket_created_at) - new Date(b.ticket_created_at));
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
  const timePart = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart}, ${timePart}`;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, sub, onClick }) {
  const clickable = typeof onClick === 'function';
  return (
    <Card
      onClick={onClick}
      sx={{
        flex: '1 1 140px', p: 2.5, bgcolor: PAPER, border: `1px solid ${BORDER}`,
        borderTop: `3px solid ${color}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
        '&:hover': clickable ? {
          transform: 'translateY(-1px)',
          bgcolor: 'rgba(90,141,196,0.04)',
          borderColor: 'rgba(148,163,184,0.20)',
        } : {},
      }}
    >
      <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 30, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: TEXT_DIM, mt: 0.5 }}>{sub}</Typography>}
    </Card>
  );
}

// ─── Ticket row (read-only) ────────────────────────────────────────────────────
function TicketRow({ ticket }) {
  const navigate = useNavigate();
  const s = statusMeta(ticket.ticket_status);

  const assignedUserId = ticket.assigned_user_id ?? ticket.assignee_id;
  const isClaimed       = assignedUserId != null;

  return (
    <Box
      onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        py: 1.75, px: 0.5, borderBottom: `1px solid ${BORDER}`,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'rgba(90,141,196,0.04)' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2' }}>#{ticket.ticket_id}</Typography>
          <Chip label={s.label} size="small" sx={{
            height: 18, fontSize: 9.5, fontWeight: 700,
            bgcolor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}33`,
          }} />
        </Box>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, '&:hover': { color: ACCENT } }} noWrap>
          {ticket.ticket_title}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: TEXT_DIM, mt: 0.2 }}>
          {formatDateTime(ticket.ticket_created_at)}
          {' · '}
          {ticket.user_name ?? ticket.user_id ?? 'Unknown user'}
          {isClaimed ? (
            <span> · <span style={{ color: '#5a8dc4' }}>↗ {firstName(ticket.assignee_name ?? String(assignedUserId))}</span></span>
          ) : (
            <span style={{ color: '#c49a4a' }}> · Unassigned</span>
          )}
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569' }}>chevron_right</span>
      </Box>
    </Box>
  );
}

// ─── Team pulse item ──────────────────────────────────────────────────────────
function PulseItem({ ticket }) {
  const p        = priorityMeta(ticket.ticket_priority ?? 'low');
  const fullName = ticket.assignee_name ?? (ticket.assigned_user_id != null ? String(ticket.assigned_user_id) : 'A TLA');
  const action   = ticket.ticket_status === 'in_progress' ? 'is working on'
                 : ticket.ticket_status === 'resolved'    ? 'resolved'
                 : ticket.ticket_status === 'struggling'  ? 'flagged'
                 : 'claimed';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
      <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, flexShrink: 0, bgcolor: `${p.color}20`, color: p.color }}>
        {getInitials(fullName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, color: TEXT_BRIGHT, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700 }}>{firstName(fullName)}</span>
          {' '}{action}{' '}
          <span style={{ fontFamily: 'monospace', color: '#5b8ec2', fontSize: 11 }}>
            #{ticket.ticket_id}
          </span>
          {' · '}
          <span style={{ color: TEXT_DIM }} title={ticket.ticket_title}>
            {ticket.ticket_title?.length > 30 ? ticket.ticket_title.slice(0, 30) + '…' : ticket.ticket_title}
          </span>
        </Typography>
        <Typography sx={{ fontSize: 11, color: TEXT_MUTED, mt: 0.25 }}>
          {timeAgo(ticket.ticket_updated_at ?? ticket.ticket_created_at)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TLAHome() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      const filtered = res.data.filter(t =>
        user?.department_id ? t.department_id === user.department_id : true
      );
      setTickets(filtered);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Derived
  const myTickets   = tickets.filter(t => (t.assigned_user_id ?? t.assignee_id) === user?.id);
  const unassigned  = getUnassigned(tickets);
  const slaBreaches = getSLABreaches(tickets);
  const resolvedToday = tickets.filter(t =>
    t.ticket_status === 'resolved' &&
    new Date(t.ticket_updated_at).toDateString() === new Date().toDateString()
  );

  const teamPulse = [...tickets]
    .filter(t => (t.assigned_user_id ?? t.assignee_id) != null)
    .sort((a, b) => new Date(b.ticket_updated_at) - new Date(a.ticket_updated_at))
    .slice(0, 8);

  // Task feed: open tickets only, oldest first (FIFO)
  const openQueue = sortByOldestFirst(tickets.filter(t => t.ticket_status === 'open'));

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          {user?.department_name ?? 'Your department'} · TLA
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>
          {greeting}, {user?.name?.split(' ')[0]}
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard
          label="My active"
          value={myTickets.filter(t => !['resolved','closed'].includes(t.ticket_status)).length}
          color={ACCENT}
          onClick={() => navigate('/tla/queue')}
        />
        <KpiCard
          label="Unassigned"
          value={unassigned.length}
          color="#c49a4a"
          sub={unassigned.length > 0 ? 'Needs attention' : 'All clear'}
          onClick={() => navigate('/tla/board?filter=unassigned')}
        />
        <KpiCard
          label="Resolved today"
          value={resolvedToday.length}
          color="#5a8f72"
          onClick={() => navigate('/tla/board?filter=resolved-today')}
        />
        <KpiCard
          label="Overdue"
          value={slaBreaches.length}
          color="#8b5e6a"
          sub={slaBreaches.length > 0 ? 'Needs attention' : 'All on track'}
          onClick={() => navigate('/tla/board?filter=overdue')}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Task feed — open tickets, FIFO */}
        <Card sx={{ flex: '1 1 480px', p: 3, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>
                Task feed
              </Typography>
              <Typography sx={{ fontSize: 11, color: TEXT_MUTED, mt: 0.25 }}>
                Open tickets · oldest first
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                px: 0.8, py: 0.15, borderRadius: 999, fontSize: 11, fontWeight: 700,
                bgcolor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}33`,
              }}>
                {openQueue.length}
              </Box>
              <Button size="small" onClick={() => navigate('/tla/board')}
                endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>view_kanban</span>}
                sx={{ fontSize: 11, color: ACCENT }}>
                Board view
              </Button>
            </Box>
          </Box>

          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: ACCENT }} />
            </Box>
          )}
          {!loading && openQueue.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: TEXT_MUTED, display: 'block', marginBottom: 8 }}>done_all</span>
              <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>Queue is clear.</Typography>
            </Box>
          )}
          {!loading && openQueue.map(t => (
            <TicketRow key={t.ticket_id} ticket={t} />
          ))}
        </Card>

        {/* Team pulse */}
        <Card sx={{ flex: '0 1 300px', p: 3, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>
              Team pulse
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7a6fa8' }} />
              <Typography sx={{ fontSize: 10.5, color: '#7a6fa8', fontWeight: 700 }}>LIVE</Typography>
            </Box>
          </Box>

          {loading && <CircularProgress size={20} sx={{ color: '#7a6fa8' }} />}
          {!loading && teamPulse.length === 0 && (
            <Typography sx={{ color: TEXT_MUTED, fontSize: 13 }}>No activity yet.</Typography>
          )}
          {!loading && teamPulse.map(t => (
            <PulseItem key={t.ticket_id} ticket={t} />
          ))}
        </Card>
      </Box>
    </Box>
  );
}