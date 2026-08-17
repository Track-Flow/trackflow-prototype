import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Tooltip,
} from '@mui/material';
import api from '../helpers/api';
import { priorityMeta, timeAgo } from '../helpers/ticketHelpers';

// ─── Theme tokens (prototype palette) ─────────────────────────────────────────
const ACCENT      = '#5a8dc4';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const BORDER      = 'rgba(148,163,184,0.10)';

const COLUMNS = [
  { key: 'open',        label: 'Open',        color: '#5a8dc4', icon: 'inbox'           },
  { key: 'in_progress', label: 'In Progress', color: '#c49a4a', icon: 'pending_actions' },
  { key: 'struggling',  label: 'Struggling',  color: '#7a6fa8', icon: 'flag'            },
  { key: 'resolved',    label: 'Resolved',    color: '#5a8f72', icon: 'check_circle'    },
  { key: 'closed',      label: 'Closed',      color: '#475569', icon: 'lock'            },
];

const DROPPABLE = ['open', 'in_progress', 'struggling', 'resolved'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getPriorityColor(priority) {
  const map = { urgent: '#8b5e6a', high: '#c49a4a', medium: '#5a8dc4', low: '#94a3b8' };
  return map[priority] ?? '#94a3b8';
}

function sortByOldestFirst(list) {
  return [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function cardLockState(ticket, userId) {
  const isClaimed    = ticket.assigned_user_id != null;
  const isOwned      = ticket.assigned_user_id === userId;
  const isOtherOwned = isClaimed && !isOwned;
  const isClosed     = ticket.ticket_status === 'closed';
  const isResolved   = ticket.ticket_status === 'resolved';
  const draggable    = isOwned && !isClosed;
  return { isClaimed, isOwned, isOtherOwned, isClosed, isResolved, draggable };
}

// ─── Note dialog (Resolve + Struggling) ───────────────────────────────────────
function NoteDialog({ open, mode, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('');
  const handleConfirm = () => { onConfirm(notes); setNotes(''); };
  const handleCancel  = () => { onCancel();        setNotes(''); };

  const isResolve = mode === 'resolved';
  const config = isResolve
    ? {
        icon: 'check_circle', iconColor: '#5a8f72',
        title: 'Resolve Ticket',
        helper: 'Add resolution notes before marking this ticket as resolved.',
        placeholder: 'Describe how the issue was resolved…',
        confirmLabel: 'Resolve', confirmColor: 'success', confirmIcon: 'check',
      }
    : {
        icon: 'flag', iconColor: '#8b5e6a',
        title: 'Flag as Struggling',
        helper: "Let the team know what you're stuck on before flagging this ticket.",
        placeholder: "What are you stuck on?",
        confirmLabel: 'Flag as Struggling', confirmColor: 'error', confirmIcon: 'flag',
      };

  return (
    <Dialog open={open} onClose={handleCancel} PaperProps={{
      sx: { bgcolor: '#111d2e', border: `1px solid ${BORDER}`, borderRadius: 2, minWidth: { xs: '92vw', sm: 420 } },
    }}>
      <DialogTitle sx={{ color: TEXT_BRIGHT, fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-outlined" style={{ color: config.iconColor, fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
            {config.icon}
          </span>
          {config.title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: TEXT_DIM, fontSize: 13, mb: 2 }}>{config.helper}</Typography>
        <TextField
          autoFocus multiline rows={4} fullWidth
          placeholder={config.placeholder}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: TEXT_BRIGHT, fontSize: 13,
              '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(143,162,192,0.4)' },
              '&.Mui-focused fieldset': { borderColor: config.iconColor },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined"
          sx={{ color: TEXT_DIM, borderColor: 'rgba(143,162,192,0.2)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm} disabled={!notes.trim()}
          variant="contained" color={config.confirmColor}
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>{config.confirmIcon}</span>}
        >
          {config.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Claim-first badge ────────────────────────────────────────────────────────
function ClaimFirstBadge() {
  return (
    <Tooltip title="Claim this ticket first — you cannot drag unassigned tickets" arrow>
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.4,
        px: 0.75, py: 0.2, borderRadius: 1,
        bgcolor: 'rgba(196,154,74,0.2)', border: '1px solid rgba(196,154,74,0.5)',
        cursor: 'help',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#c49a4a', fontVariationSettings: "'FILL' 1" }}>lock</span>
        <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#c49a4a', letterSpacing: '0.05em' }}>CLAIM FIRST</Typography>
      </Box>
    </Tooltip>
  );
}

// ─── "Closes in Xh Ym" badge ──────────────────────────────────────────────────
function computeLabel(resolvedAt) {
  if (!resolvedAt) return null;
  const closeAt   = new Date(resolvedAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining = closeAt - Date.now();
  if (remaining <= 0) return 'Closing soon';
  const totalMin  = Math.floor(remaining / 60000);
  const h         = Math.floor(totalMin / 60);
  const m         = totalMin % 60;
  return h > 0 ? `Closes in ${h}h ${m}m` : `Closes in ${m}m`;
}

function ClosesInBadge({ resolvedAt }) {
  const [label, setLabel] = useState(() => computeLabel(resolvedAt));
  useEffect(() => {
    setLabel(computeLabel(resolvedAt));
    const id = setInterval(() => setLabel(computeLabel(resolvedAt)), 60_000);
    return () => clearInterval(id);
  }, [resolvedAt]);
  if (!label) return null;
  return (
    <Tooltip title="Auto-closes 24 hours after resolution" arrow>
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.4,
        px: 0.8, py: 0.2, borderRadius: 1,
        bgcolor: 'rgba(71,85,105,0.3)', border: '1px solid rgba(71,85,105,0.5)',
        cursor: 'help',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 10, color: '#64748b' }}>schedule</span>
        <Typography sx={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>{label}</Typography>
      </Box>
    </Tooltip>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, onDragStart, onClick, onClaim, isDragging, isClaiming, userId }) {
  const { isClaimed, isOwned, isOtherOwned, isClosed, isResolved, draggable } = cardLockState(ticket, userId);
  const isStruggling  = ticket.ticket_status === 'struggling';
  const priorityColor = getPriorityColor(ticket.ticket_priority);
  const assigneeName  = ticket.assignee_name ?? (ticket.assigned_user_id != null ? String(ticket.assigned_user_id) : 'Unknown');
  const assigneeFirst = ticket.assignee_name ? ticket.assignee_name.split(' ')[0] : (ticket.assigned_user_id ?? '?');
  const assigneeInitials = getInitials(assigneeName);

  return (
    <Box
      draggable={draggable}
      onDragStart={draggable ? e => onDragStart(e, ticket) : undefined}
      onClick={() => onClick(ticket.ticket_id)}
      sx={{
        p: 1.75, mb: 1, borderRadius: 1.5, position: 'relative', overflow: 'hidden',
        bgcolor: isClosed     ? 'rgba(71,85,105,0.08)'
               : isResolved   ? 'rgba(90,143,114,0.05)'
               : !isClaimed   ? 'rgba(196,154,74,0.05)'
               : isDragging   ? 'rgba(90,141,196,0.1)'
               : '#0d1e38',
        border: `1px solid ${
          isDragging   ? ACCENT
          : isClosed   ? 'rgba(71,85,105,0.25)'
          : isResolved ? 'rgba(90,143,114,0.25)'
          : !isClaimed ? 'rgba(196,154,74,0.3)'
          : isStruggling ? 'rgba(122,111,168,0.35)'
          : BORDER
        }`,
        cursor: draggable ? 'grab' : 'pointer',
        opacity: isClosed ? 0.55 : 1,
        transition: 'all .15s',
        userSelect: 'none',
        transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        boxShadow: isDragging ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 2px ${ACCENT}44` : 'none',
        '&:hover': !isClosed ? {
          borderColor: !isClaimed ? 'rgba(196,154,74,0.5)' : isOwned ? `${ACCENT}55` : 'rgba(148,163,184,0.2)',
          transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'translateY(-1px)',
          boxShadow: isDragging ? undefined : '0 4px 20px rgba(0,0,0,0.3)',
        } : {},
        '&:active': { cursor: draggable ? 'grabbing' : 'pointer' },
      }}
    >
      {/* Left accent bar */}
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '2px 0 0 2px',
        bgcolor: isClosed ? '#475569' : isResolved ? '#5a8f72' : isOwned ? ACCENT : !isClaimed ? '#c49a4a' : priorityColor,
      }} />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pl: 0.5 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 10.5, color: '#5b8ec2', fontWeight: 600 }}>
          #{ticket.ticket_id}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {isClosed ? (
            <Tooltip title="Closed — locked" arrow>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#475569', fontVariationSettings: "'FILL' 1" }}>lock</span>
            </Tooltip>
          ) : isResolved ? (
            <ClosesInBadge resolvedAt={ticket.resolved_at} />
          ) : !isClaimed ? (
            <ClaimFirstBadge />
          ) : isOtherOwned ? (
            <Tooltip title="Claimed by someone else" arrow>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#64748b', fontVariationSettings: "'FILL' 1" }}>lock</span>
            </Tooltip>
          ) : null}
          {isStruggling && (
            <Tooltip title="Flagged as struggling" arrow>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#8b5e6a', fontVariationSettings: "'FILL' 1" }}>flag</span>
            </Tooltip>
          )}
          {ticket.ticket_priority && (
            <Box sx={{
              px: 0.75, py: 0.1, borderRadius: 0.75, fontSize: 9.5, fontWeight: 700,
              bgcolor: `${priorityColor}20`, color: priorityColor, border: `1px solid ${priorityColor}44`,
            }}>
              {ticket.ticket_priority.toUpperCase()}
            </Box>
          )}
        </Box>
      </Box>

      {/* Title */}
      <Typography sx={{
        fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT, lineHeight: 1.4, mb: 1.25, pl: 0.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {ticket.ticket_title}
      </Typography>

      {/* Department chip */}
      {ticket.department_name && (
        <Box sx={{ pl: 0.5, mb: 1.25 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.2, borderRadius: 0.75,
            fontSize: 10, fontWeight: 600,
            bgcolor: 'rgba(90,141,196,0.10)', color: '#5a8dc4', border: '1px solid rgba(90,141,196,0.22)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>corporate_fare</span>
            {ticket.department_name}
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: 0.5 }}>
        {isClaimed ? (
          <Tooltip title={assigneeName} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: `${ACCENT}25`, color: ACCENT }}>
                {assigneeInitials}
              </Avatar>
              <Typography sx={{ fontSize: 10, color: '#5b8ec2', fontWeight: 600 }}>
                {assigneeFirst}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Button
            size="small"
            disabled={isClaiming}
            onClick={e => { e.stopPropagation(); onClaim(ticket.ticket_id); }}
            startIcon={
              isClaiming
                ? <CircularProgress size={11} sx={{ color: '#c49a4a' }} />
                : <span className="material-symbols-outlined" style={{ fontSize: 12 }}>person_add</span>
            }
            sx={{
              fontSize: 10.5, py: 0.3, px: 1, minWidth: 0, lineHeight: 1.4,
              color: '#c49a4a', bgcolor: 'rgba(196,154,74,0.12)',
              border: '1px solid rgba(196,154,74,0.4)',
              '&:hover': { bgcolor: 'rgba(196,154,74,0.22)', borderColor: '#c49a4a' },
            }}
          >
            {isClaiming ? 'Claiming…' : 'Claim'}
          </Button>
        )}
        <Typography sx={{ fontSize: 10.5, color: '#3a4f6a' }}>
          {timeAgo(ticket.updated_at ?? ticket.created_at)}
        </Typography>
      </Box>

      {/* Escalated dot */}
      {ticket.ticket_escalated === 1 && (
        <Box sx={{
          position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%',
          bgcolor: '#8b5e6a', boxShadow: '0 0 0 2px rgba(139,94,106,0.3)',
        }} />
      )}
    </Box>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function KanbanColumn({ col, tickets, draggingId, claimingId, onDragStart, onDrop, onCardClick, onClaim, userId }) {
  const [isOver, setIsOver] = useState(false);
  const isClosed = col.key === 'closed';

  return (
    <Box
      onDragOver={e => { e.preventDefault(); if (!isClosed) setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={e => { setIsOver(false); onDrop(e, col.key); }}
      sx={{
        flex: '1 1 0', minWidth: { xs: 260, sm: 220 }, maxWidth: { xs: '82vw', sm: 320 },
        display: 'flex', flexDirection: 'column', borderRadius: 2,
        border: `1px solid ${isOver ? col.color + '66' : BORDER}`,
        bgcolor: isOver ? `${col.color}08` : '#080f1e',
        transition: 'all .15s', overflow: 'hidden', flexShrink: 0,
      }}
    >
      <Box sx={{
        p: 1.75, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 1,
        borderTop: `3px solid ${col.color}`,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: col.color }}>{col.icon}</span>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT_BRIGHT, flex: 1 }}>{col.label}</Typography>
        <Box sx={{
          px: 0.9, py: 0.15, borderRadius: 999, fontSize: 11, fontWeight: 700,
          bgcolor: `${col.color}18`, color: col.color, border: `1px solid ${col.color}33`,
        }}>
          {tickets.length}
        </Box>
      </Box>

      <Box sx={{
        p: 1.25, flex: 1, overflowY: 'auto', minHeight: 80,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(143,162,192,0.2)', borderRadius: 2 },
      }}>
        {tickets.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center', borderRadius: 1.5, border: `1px dashed ${BORDER}`, mt: 0.5 }}>
            <Typography sx={{ fontSize: 12, color: '#3a4f6a' }}>
              {isClosed ? 'Closes 24h after resolution' : 'No tickets'}
            </Typography>
          </Box>
        )}
        {tickets.map(t => (
          <TicketCard
            key={t.ticket_id}
            ticket={t}
            isDragging={draggingId === t.ticket_id}
            isClaiming={claimingId === t.ticket_id}
            userId={userId}
            onDragStart={onDragStart}
            onClick={onCardClick}
            onClaim={onClaim}
          />
        ))}
      </Box>
    </Box>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────
export default function TLABoard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [noteDialog, setNoteDialog] = useState({ open: false, mode: null, ticket: null });
  const dragTicket = useRef(null);
  const ticketsRef = useRef([]);

  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      const filtered = res.data.filter(t =>
        t.department_id != null &&
        (user?.department_id ? t.department_id === user.department_id : true)
      );
      setTickets(filtered);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleClaim = async (ticketId) => {
    setClaimingId(ticketId);
    setError('');
    setTickets(prev =>
      prev.map(t => t.ticket_id === ticketId
        ? { ...t, assigned_user_id: user?.id, assignee_name: user?.name }
        : t)
    );
    try {
      await api.patch(`/tickets/${ticketId}`, { assignee_id: user?.id });
      fetchTickets();
    } catch (err) {
      setTickets(prev =>
        prev.map(t => t.ticket_id === ticketId
          ? { ...t, assigned_user_id: null, assignee_name: null }
          : t)
      );
      setError(err.response?.data?.error ?? 'Failed to claim ticket. It may already be claimed.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleDragStart = (e, ticket) => {
    const { draggable } = cardLockState(ticket, user?.id);
    if (!draggable) return;
    dragTicket.current = ticket.ticket_id;
    setDraggingId(ticket.ticket_id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = dragTicket.current;
    dragTicket.current = null;
    setDraggingId(null);
    if (!id) return;

    const ticket = ticketsRef.current.find(t => t.ticket_id === id);
    if (!ticket || ticket.ticket_status === targetStatus) return;
    if (!DROPPABLE.includes(targetStatus)) return;

    const { draggable } = cardLockState(ticket, user?.id);
    if (!draggable) {
      setError(
        ticket.assigned_user_id == null
          ? 'Claim this ticket before moving it.'
          : 'You can only move tickets assigned to you.'
      );
      return;
    }

    if (targetStatus === 'resolved' || targetStatus === 'struggling') {
      setNoteDialog({ open: true, mode: targetStatus, ticket });
      return;
    }

    await performUpdate(ticket, targetStatus);
  };

  const performUpdate = async (ticket, targetStatus, notes = null) => {
    const prevStatus = ticket.ticket_status;
    setTickets(prev =>
      prev.map(t => t.ticket_id === ticket.ticket_id ? { ...t, ticket_status: targetStatus } : t)
    );
    try {
      const body = { ticket_status: targetStatus };
      if (notes) body.resolution_notes = notes;
      await api.patch(`/tickets/${ticket.ticket_id}`, body);
      fetchTickets();
    } catch {
      setTickets(prev =>
        prev.map(t => t.ticket_id === ticket.ticket_id ? { ...t, ticket_status: prevStatus } : t)
      );
      setError('Failed to update task status.');
    }
  };

  const handleNoteConfirm = async (notes) => {
    const { mode, ticket } = noteDialog;
    setNoteDialog({ open: false, mode: null, ticket: null });
    await performUpdate(ticket, mode, notes);
  };

  const ticketsByCol = col => sortByOldestFirst(tickets.filter(t => t.ticket_status === col));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexShrink: 0, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 11, color: '#5b6d8a', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.25 }}>
            {user?.name?.split(' ')[0]} · {user?.department_name ?? 'Your department'}
          </Typography>
          <Typography variant="h4" sx={{ color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>
            Kanban Board
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        
          <Button variant="outlined" onClick={() => navigate('/tla')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>dashboard</span>}
            sx={{ color: TEXT_DIM, borderColor: BORDER, fontSize: 12 }}>
            Dashboard
          </Button>
        </Box>
      </Box>

      {/* Stats strip */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexShrink: 0, flexWrap: 'wrap' }}>
        {COLUMNS.map(col => (
          <Box key={col.key} sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1.25, py: 0.6, borderRadius: 1.5, bgcolor: '#080f1e', border: `1px solid ${BORDER}`,
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: col.color }} />
            <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>{col.label}</Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: col.color }}>
              {loading ? '–' : ticketsByCol(col.key).length}
            </Typography>
          </Box>
        ))}
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* Board */}
      {loading ? (
        <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <CircularProgress size={32} sx={{ color: ACCENT }} />
        </Box>
      ) : (
        <Box sx={{
          display: 'flex', gap: 1.5, flex: 1, overflowX: 'auto', overflowY: 'hidden', pb: 1,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(143,162,192,0.2)', borderRadius: 3 },
        }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              col={col}
              tickets={ticketsByCol(col.key)}
              draggingId={draggingId}
              claimingId={claimingId}
              userId={user?.id}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onCardClick={id => navigate(`/tickets/${id}`)}
              onClaim={handleClaim}
            />
          ))}
        </Box>
      )}

      {!loading && (
        <Typography sx={{ fontSize: 11, color: '#3a4f6a', textAlign: 'center', mt: 1.5, flexShrink: 0 }}>
          Claim a ticket, then drag it between columns · Closed tickets auto-close 24h after resolution
        </Typography>
      )}

      <NoteDialog
        open={noteDialog.open}
        mode={noteDialog.mode}
        onConfirm={handleNoteConfirm}
        onCancel={() => setNoteDialog({ open: false, mode: null, ticket: null })}
      />
    </Box>
  );
}