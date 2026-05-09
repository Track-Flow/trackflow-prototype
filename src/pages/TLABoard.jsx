import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Avatar, Button,
  Dialog, DialogContent, TextField,
} from '@mui/material';
import { tfBoardCards, getUser } from '../data/mockData';

const ACCENT     = '#2ec8ff';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';
const PAPER      = '#0f1f3a';
const CARD_BG    = '#0d1e38';

// Current TLA is Lerato Mbeki id=1
const MY_TLA_ID = 1;

const COLUMNS = [
  { key: 'pending',     label: 'Pending',     color: '#c084fc', icon: 'hourglass_empty'  },
  { key: 'open',        label: 'Open',        color: '#2ec8ff', icon: 'radio_button_unchecked' },
  { key: 'in_progress', label: 'In Progress', color: '#ffb547', icon: 'pending'           },
  { key: 'resolved',    label: 'Resolved',    color: '#2bd48f', icon: 'check_circle'      },
];

const DEPT_COLORS = {
  it: '#2ec8ff', fac: '#ffb547', admin: '#c084fc', lib: '#2bd48f',
};

// ─── Resolve dialog ───────────────────────────────────────────────────────────

function ResolveDialog({ open, onCancel, onConfirm }) {
  const [notes, setNotes] = useState('');
  function handleConfirm() {
    onConfirm(notes);
    setNotes('');
  }
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          bgcolor: '#0d1e38',
          border: '1px solid rgba(143,162,192,0.15)',
          borderRadius: 3,
          minWidth: 480,
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.8)',
        },
      }}
    >
      <DialogContent sx={{ p: 3.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#2bd48f', fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>
            Resolve Ticket
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 13.5, color: TEXT_DIM, mb: 2.5 }}>
          Please provide resolution notes before marking this task as resolved.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Describe how the issue was resolved…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              fontSize: 13.5,
              '& fieldset': { borderColor: notes.trim() ? '#2bd48f' : 'rgba(143,162,192,0.2)' },
              '&:hover fieldset': { borderColor: '#2bd48f' },
              '&.Mui-focused fieldset': { borderColor: '#2bd48f' },
            },
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={onCancel}
            sx={{
              px: 3, py: 1, fontSize: 14, fontWeight: 600,
              color: TEXT_DIM, border: '1px solid rgba(143,162,192,0.2)',
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(143,162,192,0.08)' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
            sx={{
              px: 3, py: 1, fontSize: 14, fontWeight: 700,
              bgcolor: 'rgba(43,212,143,0.15)',
              color: '#2bd48f',
              border: '1px solid rgba(43,212,143,0.3)',
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(43,212,143,0.25)' },
            }}
          >
            Resolve
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({ card, onMove, onResolveClick }) {
  const navigate   = useNavigate();
  const assignee   = card.assignees?.[0] ? getUser(card.assignees[0]) : null;
  const isMyCard   = card.assignees?.includes(MY_TLA_ID);
  const isResolved = card.column === 'resolved';
  const isLocked   = isResolved;
  const deptColor  = DEPT_COLORS[card.dept] ?? '#8fa2c0';

  const colIndex = COLUMNS.findIndex(c => c.key === card.column);
  const isLast   = colIndex === COLUMNS.length - 1;
  const isFirst  = colIndex === 0;

  return (
    <Card sx={{
      p: 2, mb: 1.5, bgcolor: CARD_BG,
      border: `1px solid ${isLocked ? 'rgba(143,162,192,0.08)' : BORDER}`,
      borderRadius: 2,
      opacity: isResolved ? 0.75 : 1,
      transition: 'all 0.15s',
      ...(!isLocked && {
        cursor: 'pointer',
        '&:hover': { border: `1px solid ${ACCENT}44`, transform: 'translateY(-1px)', boxShadow: `0 4px 20px rgba(0,0,0,0.3)` },
      }),
    }}>
      {/* Top row: ID + lock */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2', fontWeight: 600 }}>
          #{card.id.replace('TF-', '')}
        </Typography>
        {(isResolved || !isMyCard) && (
          <span className="material-symbols-outlined" style={{
            fontSize: 15,
            color: isResolved ? '#2bd48f' : 'rgba(143,162,192,0.35)',
            fontVariationSettings: "'FILL' 1",
          }}>
            lock
          </span>
        )}
      </Box>

      {/* Title */}
      <Typography
        onClick={() => navigate(`/tickets/${card.id}`)}
        sx={{
          fontSize: 13.5, fontWeight: 700, color: TEXT_BRIGHT,
          lineHeight: 1.4, mb: 1.5, cursor: 'pointer',
          '&:hover': { color: ACCENT },
        }}
      >
        {card.title}
      </Typography>

      {/* Department pill */}
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75,
        px: 1, py: 0.35, borderRadius: 1, mb: 1.5,
        bgcolor: `${deptColor}12`, border: `1px solid ${deptColor}25`,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, color: deptColor }}>category</span>
        <Typography sx={{ fontSize: 11, color: deptColor, fontWeight: 600 }}>
          {card.dept === 'it' ? 'IT Support' : card.dept === 'fac' ? 'Facilities' : card.dept === 'admin' ? 'Administration' : card.dept === 'lib' ? 'Library Services' : card.dept ?? 'Unknown'}
        </Typography>
      </Box>

      {/* Assignee row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {assignee ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Avatar sx={{ width: 20, height: 20, fontSize: 8, fontWeight: 700, bgcolor: `${assignee.color}25`, color: assignee.color }}>
              {assignee.initials}
            </Avatar>
            <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>{assignee.name.split(' ')[0]}</Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 11.5, color: '#ffb547' }}>Unassigned</Typography>
        )}
        <Typography sx={{ fontSize: 11, color: 'rgba(143,162,192,0.3)' }}>—</Typography>
      </Box>

      {/* Action buttons — only for my cards that aren't resolved */}
      {isMyCard && !isResolved && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, pt: 1.25, borderTop: `1px solid ${BORDER}` }}>
          {!isFirst && (
            <Button size="small" onClick={() => onMove(card.id, 'prev')}
              sx={{ fontSize: 10, py: 0.25, px: 1, color: TEXT_DIM, bgcolor: 'rgba(143,162,192,0.06)', '&:hover': { bgcolor: 'rgba(143,162,192,0.12)' } }}>
              ← Back
            </Button>
          )}
          {!isLast && card.column !== 'in_progress' && (
            <Button size="small" onClick={() => onMove(card.id, 'next')}
              sx={{ fontSize: 10, py: 0.25, px: 1, color: ACCENT, bgcolor: `${ACCENT}0d`, '&:hover': { bgcolor: `${ACCENT}1a` }, ml: 'auto' }}>
              Forward →
            </Button>
          )}
          {card.column === 'in_progress' && (
            <Button size="small" onClick={() => onResolveClick(card.id)}
              startIcon={<span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>}
              sx={{ fontSize: 10, py: 0.25, px: 1.25, color: '#2bd48f', bgcolor: 'rgba(43,212,143,0.08)', border: '1px solid rgba(43,212,143,0.2)', '&:hover': { bgcolor: 'rgba(43,212,143,0.16)' }, ml: 'auto' }}>
              Resolve
            </Button>
          )}
        </Box>
      )}

      {/* Claim button for unassigned */}
      {!assignee && !isResolved && (
        <Box sx={{ mt: 1.5, pt: 1.25, borderTop: `1px solid ${BORDER}` }}>
          <Button size="small" fullWidth onClick={() => onMove(card.id, 'claim')}
            sx={{ fontSize: 10, py: 0.4, color: ACCENT, bgcolor: `${ACCENT}0d`, border: `1px solid ${ACCENT}22`, '&:hover': { bgcolor: `${ACCENT}1a` } }}>
            Claim ticket
          </Button>
        </Box>
      )}
    </Card>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({ col, cards, onMove, onResolveClick }) {
  return (
    <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
      {/* Column header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: `2px solid ${col.color}` }}>
        <span className="material-symbols-outlined" style={{ fontSize: 17, color: col.color, fontVariationSettings: "'FILL' 1" }}>
          {col.icon}
        </span>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>{col.label}</Typography>
        <Box sx={{ ml: 'auto', minWidth: 22, height: 22, borderRadius: '50%', bgcolor: `${col.color}20`, border: `1px solid ${col.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: col.color }}>{cards.length}</Typography>
        </Box>
      </Box>

      {cards.length === 0 ? (
        <Box sx={{ p: 2, borderRadius: 2, textAlign: 'center', border: `1px dashed ${BORDER}`, bgcolor: 'rgba(143,162,192,0.02)' }}>
          <Typography sx={{ fontSize: 11.5, color: 'rgba(143,162,192,0.4)' }}>No tickets</Typography>
        </Box>
      ) : (
        cards.map(card => (
          <BoardCard key={card.id} card={card} onMove={onMove} onResolveClick={onResolveClick} />
        ))
      )}
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TLABoard({ extraTickets = [] }) {
  const extraCards = extraTickets
    .filter(t => t.dept === 'it')
    .map(t => ({
      id:       t.id,
      column:   t.status === 'unrouted' ? 'open' : t.status,
      title:    t.title,
      priority: t.priority,
      assignees:[],
      dept:     t.dept,
      due:      '—',
    }));

  const [cards, setCards]           = useState([...extraCards, ...tfBoardCards]);
  const [resolveId, setResolveId]   = useState(null);

  function handleMove(id, direction) {
    if (direction === 'claim') {
      setCards(prev => prev.map(c => c.id === id ? { ...c, assignees: [MY_TLA_ID] } : c));
      return;
    }
    setCards(prev => prev.map(card => {
      if (card.id !== id) return card;
      const colIndex  = COLUMNS.findIndex(c => c.key === card.column);
      const nextIndex = direction === 'next' ? colIndex + 1 : colIndex - 1;
      if (nextIndex < 0 || nextIndex >= COLUMNS.length) return card;
      return { ...card, column: COLUMNS[nextIndex].key };
    }));
  }

  function handleResolveConfirm(notes) {
    setCards(prev => prev.map(c => c.id === resolveId ? { ...c, column: 'resolved' } : c));
    setResolveId(null);
  }

  // Status pill counts
  const counts = COLUMNS.reduce((acc, col) => {
    acc[col.key] = cards.filter(c => c.column === col.key).length;
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          IT Support
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>Kanban Board</Typography>
      </Box>

      {/* Status summary pills */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {COLUMNS.map(col => (
          <Box key={col.key} sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1.5, py: 0.6, borderRadius: 999,
            border: `1px solid ${col.color}44`,
            bgcolor: `${col.color}0d`,
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: col.color }} />
            <Typography sx={{ fontSize: 12, color: col.color, fontWeight: 600 }}>{col.label}</Typography>
            <Typography sx={{ fontSize: 12, color: col.color, fontWeight: 800 }}>{counts[col.key]}</Typography>
          </Box>
        ))}
      </Box>

      {/* Board */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', overflowX: 'auto', pb: 2 }}>
        {COLUMNS.map(col => (
          <Column
            key={col.key}
            col={col}
            cards={cards.filter(c => c.column === col.key)}
            onMove={handleMove}
            onResolveClick={id => setResolveId(id)}
          />
        ))}
      </Box>

      {/* Resolve dialog */}
      <ResolveDialog
        open={Boolean(resolveId)}
        onCancel={() => setResolveId(null)}
        onConfirm={handleResolveConfirm}
      />
    </Box>
  );
}