import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Button, Avatar, Chip,
  CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import api from '../helpers/api';
import { statusMeta, priorityMeta, timeAgo, getUnassigned, getSLABreaches } from '../helpers/ticketHelpers';

// ─── Theme tokens (prototype palette) ─────────────────────────────────────────
const ACCENT      = '#5a8dc4';
const PAPER       = '#111d2e';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

const FILTERS = [
  { key: 'all',        label: 'All active'     },
  { key: 'mine',       label: 'Assigned to me' },
  { key: 'unassigned', label: 'Unassigned'     },
  { key: 'sla',        label: 'SLA breach'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function firstName(fullName) {
  if (!fullName) return '?';
  return fullName.split(' ')[0];
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, sub }) {
  return (
    <Card sx={{ flex: '1 1 140px', p: 2.5, bgcolor: PAPER, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}` }}>
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

// ─── Resolution dialog ────────────────────────────────────────────────────────
function ResolutionDialog({ open, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('');
  const handleConfirm = () => { onConfirm(notes); setNotes(''); };
  const handleCancel  = () => { onCancel();        setNotes(''); };

  return (
    <Dialog open={open} onClose={handleCancel} PaperProps={{
      sx: { bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2, minWidth: { xs: '92vw', sm: 420 } },
    }}>
      <DialogTitle sx={{ color: TEXT_BRIGHT, fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-outlined" style={{ color: '#5a8f72', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Resolve Ticket
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: TEXT_DIM, fontSize: 13, mb: 2 }}>
          Add resolution notes before marking this ticket as resolved.
        </Typography>
        <TextField
          autoFocus multiline rows={4} fullWidth
          placeholder="Describe how the issue was resolved…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: TEXT_BRIGHT, fontSize: 13,
              '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(143,162,192,0.4)' },
              '&.Mui-focused fieldset': { borderColor: '#5a8f72' },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined" sx={{ color: TEXT_DIM, borderColor: 'rgba(143,162,192,0.2)' }}>Cancel</Button>
        <Button
          onClick={handleConfirm} disabled={!notes.trim()}
          variant="contained" color="success"
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
        >
          Resolve
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Ticket row ───────────────────────────────────────────────────────────────
function TicketRow({ ticket, myId, onClaim, onUpdateStatus, onResolveClick }) {
  const navigate = useNavigate();
  const s        = statusMeta(ticket.ticket_status);
  const p        = priorityMeta(ticket.ticket_priority ?? 'low');

  const assignedUserId = ticket.assigned_user_id ?? ticket.assignee_id;
  const isAssignedToMe = assignedUserId === myId;
  const isResolved     = ticket.ticket_status === 'resolved';
  const isStruggling   = ticket.ticket_status === 'struggling';
  const isClaimed      = assignedUserId != null;

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      py: 1.75, px: 0.5, borderBottom: `1px solid ${BORDER}`,
      '&:last-child': { borderBottom: 'none' },
    }}>
      {/* Priority bar */}
      <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 999, bgcolor: p.color, flexShrink: 0 }} />

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2' }}>#{ticket.ticket_id}</Typography>
          <Chip label={s.label} size="small" sx={{
            height: 18, fontSize: 9.5, fontWeight: 700,
            bgcolor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}33`,
          }} />
          {isStruggling && (
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#8b5e6a', fontVariationSettings: "'FILL' 1" }}>flag</span>
          )}
        </Box>
        <Typography
          onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
          sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, cursor: 'pointer', '&:hover': { color: ACCENT } }}
          noWrap
        >
          {ticket.ticket_title}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: TEXT_DIM, mt: 0.2 }}>
          {timeAgo(ticket.updated_at ?? ticket.created_at)}
          {' · '}
          {ticket.user_name ?? ticket.user_id ?? 'Unknown user'}
          {isClaimed ? (
            <span> · <span style={{ color: '#5a8dc4' }}>↗ {firstName(ticket.assignee_name ?? String(assignedUserId))}</span></span>
          ) : (
            <span style={{ color: '#c49a4a' }}> · Unassigned</span>
          )}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
        {!isClaimed && !isResolved && (
          <Button
            size="small" variant="contained"
            onClick={() => onClaim(ticket.ticket_id)}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 13 }}>person_add</span>}
            sx={{ fontSize: 11, py: 0.5, px: 1.5 }}
          >
            Claim
          </Button>
        )}
        {isAssignedToMe && ticket.ticket_status === 'open' && (
          <Button size="small" variant="outlined"
            onClick={() => onUpdateStatus(ticket.ticket_id, 'in_progress')}
            sx={{ fontSize: 11, py: 0.5, borderColor: 'rgba(196,154,74,0.5)', color: '#c49a4a',
              '&:hover': { borderColor: '#c49a4a', bgcolor: 'rgba(196,154,74,0.08)' } }}
          >
            Start
          </Button>
        )}
        {isAssignedToMe && ticket.ticket_status === 'struggling' && (
          <Button size="small" variant="outlined"
            onClick={() => onUpdateStatus(ticket.ticket_id, 'in_progress')}
            sx={{ fontSize: 11, py: 0.5, borderColor: 'rgba(196,154,74,0.5)', color: '#c49a4a',
              '&:hover': { borderColor: '#c49a4a', bgcolor: 'rgba(196,154,74,0.08)' } }}
          >
            Resume
          </Button>
        )}
        {isAssignedToMe && (ticket.ticket_status === 'in_progress' || ticket.ticket_status === 'struggling') && (
          <Button size="small" variant="outlined"
            onClick={() => onResolveClick(ticket)}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>}
            sx={{ fontSize: 11, py: 0.5, borderColor: 'rgba(90,143,114,0.5)', color: '#5a8f72',
              '&:hover': { borderColor: '#5a8f72', bgcolor: 'rgba(90,143,114,0.08)' } }}
          >
            Resolve
          </Button>
        )}
        {isResolved && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: 1,
            bgcolor: 'rgba(90,143,114,0.08)', border: '1px solid rgba(90,143,114,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#5a8f72' }}>lock</span>
            <Typography sx={{ fontSize: 11, color: '#5a8f72', fontWeight: 600 }}>Resolved</Typography>
          </Box>
        )}
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
          {timeAgo(ticket.updated_at ?? ticket.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TLAHome() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [filter,        setFilter]        = useState('all');
  const [snack,         setSnack]         = useState({ open: false, message: '' });
  const [resolveDialog, setResolveDialog] = useState({ open: false, ticket: null });

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

  const handleClaim = async (id) => {
    try {
      await api.patch(`/tickets/${id}`, { assignee_id: user.id });
      setSnack({ open: true, message: `Ticket #${id} claimed.` });
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to claim.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/${id}`, { ticket_status: status });
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to update.');
    }
  };

  const handleResolveClick  = (ticket) => setResolveDialog({ open: true, ticket });
  const handleResolveCancel = ()       => setResolveDialog({ open: false, ticket: null });
  const handleResolveConfirm = async (notes) => {
    const { ticket } = resolveDialog;
    setResolveDialog({ open: false, ticket: null });
    try {
      await api.patch(`/tickets/${ticket.ticket_id}`, { ticket_status: 'resolved', resolution_notes: notes });
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to resolve.');
    }
  };

  // Derived
  const active      = tickets.filter(t => !['resolved', 'closed'].includes(t.ticket_status));
  const myTickets   = tickets.filter(t => (t.assigned_user_id ?? t.assignee_id) === user?.id);
  const unassigned  = getUnassigned(tickets);
  const slaBreaches = getSLABreaches(tickets);
  const resolvedToday = tickets.filter(t =>
    t.ticket_status === 'resolved' &&
    new Date(t.updated_at).toDateString() === new Date().toDateString()
  );

  const teamPulse = [...tickets]
    .filter(t => (t.assigned_user_id ?? t.assignee_id) != null)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8);

  const displayed =
    filter === 'mine'       ? myTickets
    : filter === 'unassigned' ? unassigned
    : filter === 'sla'        ? slaBreaches
    : active;

  const filterCounts = {
    all:        active.length,
    mine:       myTickets.length,
    unassigned: unassigned.length,
    sla:        slaBreaches.length,
  };

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
        <KpiCard label="My active"      value={myTickets.filter(t => !['resolved','closed'].includes(t.ticket_status)).length}
                 color={ACCENT} />
        <KpiCard label="Unassigned"     value={unassigned.length} color="#c49a4a"
                 sub={unassigned.length > 0 ? 'Needs attention' : 'All clear'} />
        <KpiCard label="Resolved today" value={resolvedToday.length} color="#5a8f72" />
        <KpiCard label="Overdue"        value={slaBreaches.length} color="#8b5e6a"
                 sub={slaBreaches.length > 0 ? 'Needs attention' : 'All on track'} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Ticket queue */}
        <Card sx={{ flex: '1 1 480px', p: 3, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>
              Task feed
            </Typography>
            <Button size="small" onClick={() => navigate('/tla/board')}
              endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>view_kanban</span>}
              sx={{ fontSize: 11, color: ACCENT }}>
              Board view
            </Button>
          </Box>

          {/* Filter tabs */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <Button key={f.key} size="small" onClick={() => setFilter(f.key)}
                  sx={{
                    fontSize: 11, py: 0.4, px: 1.25, borderRadius: 1.5, gap: 0.75,
                    fontWeight: active ? 700 : 400,
                    color: active ? ACCENT : TEXT_DIM,
                    bgcolor: active ? `${ACCENT}15` : 'transparent',
                  }}
                >
                  {f.label}
                  <Box sx={{
                    px: 0.6, py: 0.05, borderRadius: 999,
                    bgcolor: active ? ACCENT : '#1a2d4a',
                    fontSize: 10, fontWeight: 700,
                    color: active ? '#0a1628' : TEXT_MUTED,
                  }}>
                    {filterCounts[f.key]}
                  </Box>
                </Button>
              );
            })}
          </Box>

          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: ACCENT }} />
            </Box>
          )}
          {!loading && displayed.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: TEXT_MUTED, display: 'block', marginBottom: 8 }}>done_all</span>
              <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>Queue is clear.</Typography>
            </Box>
          )}
          {!loading && displayed.map(t => (
            <TicketRow key={t.ticket_id} ticket={t} myId={user?.id}
              onClaim={handleClaim}
              onUpdateStatus={handleUpdateStatus}
              onResolveClick={handleResolveClick}
            />
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

      <ResolutionDialog
        open={resolveDialog.open}
        onConfirm={handleResolveConfirm}
        onCancel={handleResolveCancel}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnack({ open: false, message: '' })}
          severity="success" variant="filled"
          sx={{ bgcolor: '#5a8f72', color: '#0a1628', fontWeight: 700 }}
        >
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}