import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Tooltip,
} from '@mui/material';
import { tfBoardCards, getUser } from '../data/mockData';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT      = '#5a8dc4';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const BORDER      = 'rgba(148,163,184,0.10)';
const MY_TLA_ID   = 1;

const COLUMNS = [
  { key: 'open',        label: 'Open',        color: '#5a8dc4', icon: 'inbox'           },
  { key: 'in_progress', label: 'In Progress', color: '#c49a4a', icon: 'pending_actions'  },
  { key: 'pending',     label: 'Pending',     color: '#7a6fa8', icon: 'hourglass_top'    },
  { key: 'resolved',    label: 'Resolved',    color: '#5a8f72', icon: 'check_circle'     },
  { key: 'closed',      label: 'Closed',      color: '#475569', icon: 'lock'             },
];

const DEPT_LABELS = { it: 'IT Support', fac: 'Facilities', admin: 'Administration', lib: 'Library Services' };
const DEPT_COLORS = { it: '#5a8dc4', fac: '#c49a4a', admin: '#7a6fa8', lib: '#5a8f72' };
const DROPPABLE   = ['open', 'in_progress', 'pending', 'resolved'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cardStatus(card) {
  const assignees   = card.assignees ?? [];
  const isOwned     = assignees.includes(MY_TLA_ID);
  const isUnassigned = assignees.length === 0;
  const isOtherOwned = !isOwned && !isUnassigned;
  const isResolved  = card.column === 'resolved';
  const isClosed    = card.column === 'closed';
  const draggable   = isOwned && !isResolved && !isClosed;
  return { isOwned, isUnassigned, isOtherOwned, isResolved, isClosed, draggable };
}

// ─── Resolution Dialog ────────────────────────────────────────────────────────
function ResolutionDialog({ open, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('');
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{
      sx: { bgcolor: '#111d2e', border: `1px solid ${BORDER}`, borderRadius: 2, minWidth: { xs: '92vw', sm: 420 } },
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
        <Button onClick={onCancel} variant="outlined"
          sx={{ color: TEXT_DIM, borderColor: 'rgba(143,162,192,0.2)' }}>
          Cancel
        </Button>
        <Button
          onClick={() => { onConfirm(notes); setNotes(''); }}
          disabled={!notes.trim()} variant="contained" color="success"
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}>
          Resolve
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Countdown Badge ──────────────────────────────────────────────────────────
function CountdownBadge({ seconds }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.8, py: 0.2, borderRadius: 1, bgcolor: 'rgba(71,85,105,0.3)', border: '1px solid rgba(71,85,105,0.5)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 10, color: '#64748b' }}>schedule</span>
      <Typography sx={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>Closing in {seconds}s</Typography>
    </Box>
  );
}

// ─── Lock Badge ───────────────────────────────────────────────────────────────
function LockBadge({ type }) {
  if (type === 'unassigned') return (
    <Tooltip title="Claim this ticket first — you cannot drag unassigned tickets" arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.2, borderRadius: 1, bgcolor: 'rgba(196,154,74,0.2)', border: '1px solid rgba(196,154,74,0.5)', cursor: 'help' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#c49a4a', fontVariationSettings: "'FILL' 1" }}>lock</span>
        <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#c49a4a', letterSpacing: '0.05em' }}>CLAIM FIRST</Typography>
      </Box>
    </Tooltip>
  );
  if (type === 'other') return (
    <Tooltip title="Assigned to someone else" arrow>
      <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#64748b', fontVariationSettings: "'FILL' 1" }}>lock</span>
    </Tooltip>
  );
  if (type === 'closed') return (
    <Tooltip title="Ticket is closed" arrow>
      <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#475569', fontVariationSettings: "'FILL' 1" }}>lock</span>
    </Tooltip>
  );
  return null;
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ card, isDragging, onDragStart, onTouchStart, onClaim, countdown }) {
  const navigate = useNavigate();
  const { isOwned, isUnassigned, isOtherOwned, isResolved, isClosed, draggable } = cardStatus(card);
  const assignee  = card.assignees?.[0] ? getUser(card.assignees[0]) : null;
  const deptColor = DEPT_COLORS[card.dept] ?? '#94a3b8';

  // Which lock to show
  const lockType = isClosed ? 'closed' : isUnassigned ? 'unassigned' : isOtherOwned ? 'other' : null;

  return (
    <Box
      draggable={draggable}
      onDragStart={draggable ? e => onDragStart(e, card) : undefined}
      onTouchStart={draggable ? e => onTouchStart(e, card) : undefined}
      sx={{
        p: 1.75, mb: 1, borderRadius: 1.5, position: 'relative', overflow: 'hidden',
        bgcolor: isClosed    ? 'rgba(71,85,105,0.08)'
               : isResolved  ? 'rgba(90,143,114,0.05)'
               : isUnassigned ? 'rgba(196,154,74,0.05)'
               : isDragging  ? 'rgba(90,141,196,0.1)'
               : '#0d1e38',
        border: `1px solid ${
          isDragging   ? ACCENT
          : isClosed   ? 'rgba(71,85,105,0.25)'
          : isResolved ? 'rgba(90,143,114,0.25)'
          : isUnassigned ? 'rgba(196,154,74,0.3)'
          : BORDER
        }`,
        cursor: draggable ? 'grab' : 'default',
        opacity: isClosed ? 0.5 : 1,
        transition: 'all .15s',
        userSelect: 'none', WebkitUserSelect: 'none',
        touchAction: draggable ? 'none' : 'auto',
        transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        boxShadow: isDragging ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 2px ${ACCENT}44` : 'none',
        '&:hover': !isClosed ? {
          borderColor: isUnassigned ? 'rgba(196,154,74,0.5)' : isOwned ? `${ACCENT}55` : 'rgba(148,163,184,0.2)',
          transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'translateY(-1px)',
          boxShadow: isDragging ? undefined : '0 4px 20px rgba(0,0,0,0.3)',
        } : {},
        '&:active': { cursor: draggable ? 'grabbing' : 'default' },
      }}
    >
      {/* Left accent bar */}
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '2px 0 0 2px',
        bgcolor: isClosed ? '#475569' : isResolved ? '#5a8f72' : isOwned ? ACCENT : isUnassigned ? '#c49a4a' : '#475569',
      }} />

      {/* Top row: ID + badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pl: 0.5 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 10.5, color: '#5b8ec2', fontWeight: 600 }}>
          #{card.id.replace('TF-', '')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {countdown != null && <CountdownBadge seconds={countdown} />}
          {lockType && <LockBadge type={lockType} />}
          {draggable && (
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: TEXT_DIM }}>drag_indicator</span>
          )}
        </Box>
      </Box>

      {/* Title */}
      <Typography
        onClick={() => navigate(`/tickets/${card.id}`)}
        sx={{
          fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT, lineHeight: 1.4, mb: 1.25, pl: 0.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          cursor: 'pointer', '&:hover': { color: ACCENT },
        }}
      >
        {card.title}
      </Typography>

      {/* Dept chip */}
      <Box sx={{ pl: 0.5, mb: 1.25 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.2, borderRadius: 0.75, fontSize: 10, fontWeight: 600, bgcolor: `${deptColor}12`, color: deptColor, border: `1px solid ${deptColor}22` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 10 }}>category</span>
          {DEPT_LABELS[card.dept] ?? card.dept}
        </Box>
      </Box>

      {/* Footer: assignee OR claim button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: 0.5 }}>
        {assignee ? (
          <Tooltip title={assignee.name} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: `${assignee.color}25`, color: assignee.color }}>
                {assignee.initials}
              </Avatar>
              <Typography sx={{ fontSize: 10, color: '#5b8ec2', fontWeight: 600 }}>
                {assignee.name.split(' ')[0]}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Button
            size="small"
            onClick={() => onClaim(card.id)}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 12 }}>person_add</span>}
            sx={{
              fontSize: 10.5, py: 0.3, px: 1, minWidth: 0, lineHeight: 1.4,
              color: '#c49a4a',
              bgcolor: 'rgba(196,154,74,0.12)',
              border: '1px solid rgba(196,154,74,0.4)',
              '&:hover': { bgcolor: 'rgba(196,154,74,0.22)', borderColor: '#c49a4a' },
            }}
          >
            Claim
          </Button>
        )}
        <Typography sx={{ fontSize: 10.5, color: '#3a4f6a' }}>{card.due}</Typography>
      </Box>
    </Box>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ col, cards, draggingId, onDragStart, onTouchStart, onDrop, onClaim, countdowns }) {
  const [isOver, setIsOver] = useState(false);
  const isClosed = col.key === 'closed';

  return (
    <Box
      data-colkey={col.key}
      onDragOver={e => { e.preventDefault(); if (!isClosed) setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={e => { setIsOver(false); onDrop(e, col.key); }}
      sx={{
        flex: '1 1 0',
        minWidth: { xs: 260, sm: 220 },
        maxWidth: { xs: '82vw', sm: 320 },
        display: 'flex', flexDirection: 'column',
        borderRadius: 2,
        border: `1px solid ${isOver ? col.color + '66' : BORDER}`,
        bgcolor: isOver ? `${col.color}08` : '#080f1e',
        transition: 'all .15s',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <Box sx={{ p: 1.75, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 1, borderTop: `3px solid ${col.color}` }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: col.color }}>{col.icon}</span>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT_BRIGHT, flex: 1 }}>{col.label}</Typography>
        <Box sx={{ px: 0.9, py: 0.15, borderRadius: 999, fontSize: 11, fontWeight: 700, bgcolor: `${col.color}18`, color: col.color, border: `1px solid ${col.color}33` }}>
          {cards.length}
        </Box>
      </Box>

      {/* Cards list */}
      <Box sx={{ p: 1.25, flex: 1, overflowY: 'auto', minHeight: 80,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(143,162,192,0.2)', borderRadius: 2 },
      }}>
        {cards.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center', borderRadius: 1.5, border: `1px dashed ${BORDER}`, mt: 0.5 }}>
            <Typography sx={{ fontSize: 12, color: '#3a4f6a' }}>
              {isClosed ? 'Auto-closes after 10s' : 'Drop here'}
            </Typography>
          </Box>
        )}
        {cards.map(card => (
          <TicketCard
            key={card.id}
            card={card}
            isDragging={draggingId === card.id}
            onDragStart={onDragStart}
            onTouchStart={onTouchStart}
            onClaim={onClaim}
            countdown={countdowns[card.id] ?? null}
          />
        ))}
      </Box>
    </Box>
  );
}

// ─── Ghost for touch drag ─────────────────────────────────────────────────────
function createGhost(title) {
  const el = document.createElement('div');
  el.textContent = title;
  el.style.cssText = `
    position:fixed;z-index:9999;pointer-events:none;
    padding:10px 14px;border-radius:8px;
    background:#1a2f4e;border:1px solid #5a8dc4;
    color:#e3e8f0;font-size:12px;font-weight:600;font-family:sans-serif;
    max-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.5);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    transform:rotate(2deg);opacity:.95;
  `;
  document.body.appendChild(el);
  return el;
}

// ─── Main Board ───────────────────────────────────────────────────────────────
export default function TLABoard({ extraTickets = [] }) {
  const navigate = useNavigate();

  // Deep-copy tfBoardCards so mutations never touch the module constant
  const initialCards = [
    ...extraTickets.filter(t => t.dept === 'it').map(t => ({
      id: t.id, column: t.status === 'unrouted' ? 'open' : t.status,
      title: t.title, assignees: [], dept: t.dept, due: '—',
    })),
    ...tfBoardCards.map(c => ({ ...c, assignees: [...(c.assignees ?? [])] })),
  ];

  const [cards,         setCards]         = useState(initialCards);
  const [draggingId,    setDraggingId]    = useState(null);
  const [resolveDialog, setResolveDialog] = useState({ open: false, card: null });
  const [countdowns,    setCountdowns]    = useState({});
  const [error,         setError]         = useState('');

  // refs for drag — always hold latest cards so closures don't go stale
  const cardsRef    = useRef(cards);
  const dragCard    = useRef(null);
  const timersRef   = useRef({});
  const touchCard   = useRef(null);
  const ghostEl     = useRef(null);
  const touchColRef = useRef(null);

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  // ── Auto-close timer ───────────────────────────────────────────────────────
  function startCloseTimer(cardId) {
    if (timersRef.current[cardId]) return;
    let rem = 10;
    setCountdowns(p => ({ ...p, [cardId]: rem }));
    timersRef.current[cardId] = setInterval(() => {
      rem -= 1;
      if (rem <= 0) {
        clearInterval(timersRef.current[cardId]);
        delete timersRef.current[cardId];
        setCountdowns(p => { const n = { ...p }; delete n[cardId]; return n; });
        setCards(p => p.map(c => c.id === cardId ? { ...c, column: 'closed' } : c));
      } else {
        setCountdowns(p => ({ ...p, [cardId]: rem }));
      }
    }, 1000);
  }

  function cancelCloseTimer(cardId) {
    if (timersRef.current[cardId]) { clearInterval(timersRef.current[cardId]); delete timersRef.current[cardId]; }
    setCountdowns(p => { const n = { ...p }; delete n[cardId]; return n; });
  }

  useEffect(() => () => Object.values(timersRef.current).forEach(clearInterval), []);

  // ── Claim ──────────────────────────────────────────────────────────────────
  function handleClaim(cardId) {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, assignees: [MY_TLA_ID] } : c
    ));
  }

  // ── Move logic — reads from cardsRef to avoid stale closures ──────────────
  const performMove = useCallback((cardId, targetCol) => {
    const liveCard = cardsRef.current.find(c => c.id === cardId);
    if (!liveCard) return;
    if (liveCard.column === targetCol) return;
    if (!DROPPABLE.includes(targetCol)) return;

    const { isOwned, isUnassigned } = cardStatus(liveCard);

    if (isUnassigned) {
      setError('Claim this ticket first before moving it.');
      return;
    }
    if (!isOwned) {
      setError('You can only move tickets assigned to you.');
      return;
    }
    if (liveCard.column === 'resolved') cancelCloseTimer(cardId);

    if (targetCol === 'resolved') {
      setResolveDialog({ open: true, card: liveCard });
      return;
    }

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column: targetCol } : c));
  }, []);

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  function handleDragStart(e, card) {
    dragCard.current = card;
    setDraggingId(card.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
  }

  function handleDrop(e, targetCol) {
    e.preventDefault();
    const id = dragCard.current?.id;
    dragCard.current = null;
    setDraggingId(null);
    if (id) performMove(id, targetCol);
  }

  function handleDragEnd() {
    dragCard.current = null;
    setDraggingId(null);
  }

  // ── Touch drag ─────────────────────────────────────────────────────────────
  function handleTouchStart(e, card) {
    touchCard.current = card.id;
    setDraggingId(card.id);
    const t = e.touches[0];
    ghostEl.current = createGhost(card.title);
    ghostEl.current.style.left = `${t.clientX - 60}px`;
    ghostEl.current.style.top  = `${t.clientY - 30}px`;
  }

  useEffect(() => {
    function onTouchMove(e) {
      if (!touchCard.current || !ghostEl.current) return;
      e.preventDefault();
      const t = e.touches[0];
      ghostEl.current.style.left = `${t.clientX - 60}px`;
      ghostEl.current.style.top  = `${t.clientY - 30}px`;

      ghostEl.current.style.display = 'none';
      const el = document.elementFromPoint(t.clientX, t.clientY);
      ghostEl.current.style.display = '';

      const colEl = el?.closest('[data-colkey]');
      touchColRef.current = colEl?.getAttribute('data-colkey') ?? null;

      document.querySelectorAll('[data-colkey]').forEach(c => {
        c.style.outline = ''; c.style.backgroundColor = '';
      });
      if (colEl && touchColRef.current !== 'closed') {
        const def = COLUMNS.find(c => c.key === touchColRef.current);
        if (def) { colEl.style.outline = `2px dashed ${def.color}88`; colEl.style.backgroundColor = `${def.color}08`; }
      }
    }

    function onTouchEnd() {
      document.querySelectorAll('[data-colkey]').forEach(c => { c.style.outline = ''; c.style.backgroundColor = ''; });
      if (ghostEl.current) { ghostEl.current.remove(); ghostEl.current = null; }
      const id     = touchCard.current;
      const target = touchColRef.current;
      touchCard.current   = null;
      touchColRef.current = null;
      setDraggingId(null);
      if (id && target) performMove(id, target);
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onTouchEnd);
    };
  }, [performMove]);

  // ── Resolve confirmed ──────────────────────────────────────────────────────
  function handleResolveConfirm() {
    const { card } = resolveDialog;
    setResolveDialog({ open: false, card: null });
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, column: 'resolved' } : c));
    setTimeout(() => startCloseTimer(card.id), 50);
  }

  const ticketsByCol = col => cards.filter(c => c.column === col);

  return (
    <Box onDragEnd={handleDragEnd} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexShrink: 0, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 11, color: '#5b6d8a', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.25 }}>
            IT Support · TLA
          </Typography>
          <Typography variant="h4" sx={{ color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>
            Kanban Board
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.5, borderRadius: 999, border: '1px solid rgba(43,212,143,0.3)', bgcolor: 'rgba(43,212,143,0.07)' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2bd48f',
              animation: 'tfpulse 2s ease-in-out infinite',
              '@keyframes tfpulse': { '0%,100%': { boxShadow: '0 0 0 0 rgba(43,212,143,0.4)' }, '50%': { boxShadow: '0 0 0 5px rgba(43,212,143,0)' } },
            }} />
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#2bd48f' }}>LIVE</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate('/tla')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>dashboard</span>}
            sx={{ color: '#8fa2c0', borderColor: BORDER, fontSize: 12 }}>
            Dashboard
          </Button>
        </Box>
      </Box>

      {/* Stats strip */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexShrink: 0, flexWrap: 'wrap' }}>
        {COLUMNS.map(col => (
          <Box key={col.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6, borderRadius: 1.5, bgcolor: '#080f1e', border: `1px solid ${BORDER}` }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: col.color }} />
            <Typography sx={{ fontSize: 11.5, color: '#8fa2c0' }}>{col.label}</Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: col.color }}>{ticketsByCol(col.key).length}</Typography>
          </Box>
        ))}
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* Board */}
      <Box sx={{ display: 'flex', gap: 1.5, flex: 1, overflowX: 'auto', overflowY: 'hidden', pb: 1,
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(143,162,192,0.2)', borderRadius: 3 },
      }}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            col={col}
            cards={ticketsByCol(col.key)}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onTouchStart={handleTouchStart}
            onDrop={handleDrop}
            onClaim={handleClaim}
            countdowns={countdowns}
          />
        ))}
      </Box>

      <Typography sx={{ fontSize: 11, color: '#3a4f6a', textAlign: 'center', mt: 1.5, flexShrink: 0 }}>
        Claim a ticket, then drag it between columns · Resolved tickets auto-close after 10s
      </Typography>

      <ResolutionDialog
        open={resolveDialog.open}
        onConfirm={handleResolveConfirm}
        onCancel={() => setResolveDialog({ open: false, card: null })}
      />
    </Box>
  );
}