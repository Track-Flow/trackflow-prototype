import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, Avatar, Button, Dialog, DialogContent, TextField } from '@mui/material';
import { tfBoardCards, getUser } from '../data/mockData';

const ACCENT    = '#5a8dc4';
const TEXT_DIM  = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const BORDER    = 'rgba(148,163,184,0.10)';
const CARD_BG   = '#111d2e';
const MY_TLA_ID = 1;

const COLUMNS = [
  { key: 'pending',     label: 'Pending',     color: '#7a6fa8', icon: 'hourglass_empty'        },
  { key: 'open',        label: 'Open',        color: '#5a8dc4', icon: 'radio_button_unchecked'  },
  { key: 'in_progress', label: 'In Progress', color: '#c49a4a', icon: 'pending'                 },
  { key: 'resolved',    label: 'Resolved',    color: '#5a8f72', icon: 'check_circle'             },
];

const DEPT_LABELS = { it: 'IT Support', fac: 'Facilities', admin: 'Administration', lib: 'Library Services' };
const DEPT_COLORS = { it: '#5a8dc4', fac: '#c49a4a', admin: '#7a6fa8', lib: '#5a8f72' };

function ResolveDialog({ open, onCancel, onConfirm }) {
  const [notes, setNotes] = useState('');
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{
      sx: { bgcolor: '#111d2e', border: `1px solid ${BORDER}`, borderRadius: 2, width: { xs: '95vw', sm: 460 }, maxWidth: '95vw', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }
    }}>
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a8f72', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>Resolve Ticket</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mb: 2 }}>
          Please provide resolution notes before marking this task as resolved.
        </Typography>
        <TextField
          fullWidth multiline rows={4}
          placeholder="Describe how the issue was resolved…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: notes.trim() ? '#5a8f72' : BORDER },
              '&:hover fieldset': { borderColor: '#5a8f72' },
              '&.Mui-focused fieldset': { borderColor: '#5a8f72' },
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} sx={{ color: TEXT_DIM, border: `1px solid ${BORDER}`, px: 2.5, borderRadius: 1.5 }}>Cancel</Button>
          <Button
            onClick={() => { onConfirm(notes); setNotes(''); }}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>check</span>}
            sx={{ bgcolor: 'rgba(90,143,114,0.15)', color: '#5a8f72', border: '1px solid rgba(90,143,114,0.3)', px: 2.5, borderRadius: 1.5, fontWeight: 700, '&:hover': { bgcolor: 'rgba(90,143,114,0.25)' } }}>
            Resolve
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function BoardCard({ card, onMove, onResolveClick }) {
  const navigate   = useNavigate();
  const assignee   = card.assignees?.[0] ? getUser(card.assignees[0]) : null;
  const isMyCard   = card.assignees?.includes(MY_TLA_ID);
  const isResolved = card.column === 'resolved';
  const deptColor  = DEPT_COLORS[card.dept] ?? '#94a3b8';
  const colIndex   = COLUMNS.findIndex(c => c.key === card.column);

  return (
    <Card sx={{
      p: 1.75, mb: 1.25, bgcolor: CARD_BG,
      border: `1px solid ${isResolved ? 'rgba(148,163,184,0.06)' : BORDER}`,
      borderRadius: 1.5,
      opacity: isResolved ? 0.72 : 1,
      transition: 'all 0.15s',
      ...(!isResolved && { '&:hover': { border: `1px solid ${ACCENT}44`, transform: 'translateY(-1px)' } }),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: ACCENT, fontWeight: 600 }}>
          #{card.id.replace('TF-', '')}
        </Typography>
        {(isResolved || !isMyCard) && (
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: isResolved ? '#5a8f72' : 'rgba(148,163,184,0.35)', fontVariationSettings: "'FILL' 1" }}>lock</span>
        )}
      </Box>

      <Typography
        onClick={() => navigate(`/tickets/${card.id}`)}
        sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT, lineHeight: 1.4, mb: 1.25, cursor: 'pointer', '&:hover': { color: ACCENT } }}
      >
        {card.title}
      </Typography>

      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 0.9, py: 0.3, borderRadius: 1, mb: 1.25, bgcolor: `${deptColor}12`, border: `1px solid ${deptColor}22` }}>
        <span className="material-symbols-outlined" style={{ fontSize: 10, color: deptColor }}>category</span>
        <Typography sx={{ fontSize: 10.5, color: deptColor, fontWeight: 600 }}>{DEPT_LABELS[card.dept] ?? card.dept}</Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {assignee ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Avatar sx={{ width: 18, height: 18, fontSize: 8, fontWeight: 700, bgcolor: `${assignee.color}25`, color: assignee.color }}>{assignee.initials}</Avatar>
            <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{assignee.name.split(' ')[0]}</Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 11, color: '#c49a4a' }}>Unassigned</Typography>
        )}
      </Box>

      {/* Claim button */}
      {!assignee && !isResolved && (
        <Box sx={{ mt: 1.25, pt: 1, borderTop: `1px solid ${BORDER}` }}>
          <Button size="small" fullWidth onClick={() => onMove(card.id, 'claim')}
            sx={{ fontSize: 10.5, py: 0.4, color: ACCENT, bgcolor: `${ACCENT}0d`, border: `1px solid ${ACCENT}22`, '&:hover': { bgcolor: `${ACCENT}1a` } }}>
            Claim ticket
          </Button>
        </Box>
      )}

      {/* Move / resolve actions */}
      {isMyCard && !isResolved && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1.25, pt: 1, borderTop: `1px solid ${BORDER}` }}>
          {colIndex > 0 && (
            <Button size="small" onClick={() => onMove(card.id, 'prev')}
              sx={{ fontSize: 10, py: 0.25, px: 0.75, color: TEXT_DIM, bgcolor: 'rgba(148,163,184,0.06)', minWidth: 0 }}>
              ←
            </Button>
          )}
          {card.column === 'in_progress' ? (
            <Button size="small" onClick={() => onResolveClick(card.id)}
              startIcon={<span className="material-symbols-outlined" style={{ fontSize: 11 }}>check</span>}
              sx={{ fontSize: 10, py: 0.25, px: 1, color: '#5a8f72', bgcolor: 'rgba(90,143,114,0.08)', border: '1px solid rgba(90,143,114,0.2)', ml: 'auto', '&:hover': { bgcolor: 'rgba(90,143,114,0.16)' } }}>
              Resolve
            </Button>
          ) : colIndex < COLUMNS.length - 1 && (
            <Button size="small" onClick={() => onMove(card.id, 'next')}
              sx={{ fontSize: 10, py: 0.25, px: 1, color: ACCENT, bgcolor: `${ACCENT}0d`, ml: 'auto' }}>
              Forward →
            </Button>
          )}
        </Box>
      )}
    </Card>
  );
}

function Column({ col, cards, onMove, onResolveClick }) {
  return (
    <Box sx={{ flex: '0 0 auto', width: { xs: 240, sm: 260, md: 280 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75, pb: 1.25, borderBottom: `2px solid ${col.color}` }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: col.color, fontVariationSettings: "'FILL' 1" }}>{col.icon}</span>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT_BRIGHT }}>{col.label}</Typography>
        <Box sx={{ ml: 'auto', minWidth: 20, height: 20, borderRadius: '50%', bgcolor: `${col.color}20`, border: `1px solid ${col.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: col.color }}>{cards.length}</Typography>
        </Box>
      </Box>
      {cards.length === 0 ? (
        <Box sx={{ p: 2, borderRadius: 1.5, textAlign: 'center', border: `1px dashed ${BORDER}`, bgcolor: 'rgba(148,163,184,0.02)' }}>
          <Typography sx={{ fontSize: 11.5, color: 'rgba(148,163,184,0.35)' }}>No tickets</Typography>
        </Box>
      ) : cards.map(card => (
        <BoardCard key={card.id} card={card} onMove={onMove} onResolveClick={onResolveClick} />
      ))}
    </Box>
  );
}

export default function TLABoard({ extraTickets = [] }) {
  const extraCards = extraTickets.filter(t => t.dept === 'it').map(t => ({
    id: t.id, column: t.status === 'unrouted' ? 'open' : t.status,
    title: t.title, assignees: [], dept: t.dept, due: '—',
  }));

  const [cards, setCards]         = useState([...extraCards, ...tfBoardCards]);
  const [resolveId, setResolveId] = useState(null);

  function handleMove(id, direction) {
    if (direction === 'claim') { setCards(prev => prev.map(c => c.id === id ? { ...c, assignees: [MY_TLA_ID] } : c)); return; }
    setCards(prev => prev.map(card => {
      if (card.id !== id) return card;
      const ci = COLUMNS.findIndex(c => c.key === card.column);
      const ni = direction === 'next' ? ci + 1 : ci - 1;
      if (ni < 0 || ni >= COLUMNS.length) return card;
      return { ...card, column: COLUMNS[ni].key };
    }));
  }

  const counts = COLUMNS.reduce((acc, col) => { acc[col.key] = cards.filter(c => c.column === col.key).length; return acc; }, {});

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>IT Support</Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT }}>Kanban Board</Typography>
      </Box>

      {/* Status pills */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
        {COLUMNS.map(col => (
          <Box key={col.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.5, borderRadius: 999, border: `1px solid ${col.color}44`, bgcolor: `${col.color}0d` }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: col.color }} />
            <Typography sx={{ fontSize: 11.5, color: col.color, fontWeight: 600 }}>{col.label}</Typography>
            <Typography sx={{ fontSize: 11.5, color: col.color, fontWeight: 800 }}>{counts[col.key]}</Typography>
          </Box>
        ))}
      </Box>

      {/* Board — horizontal scroll on all screen sizes */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start',
        '&::-webkit-scrollbar': { height: 5 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: '#1e2d42', borderRadius: 3 },
      }}>
        {COLUMNS.map(col => (
          <Column key={col.key} col={col} cards={cards.filter(c => c.column === col.key)} onMove={handleMove} onResolveClick={id => setResolveId(id)} />
        ))}
      </Box>

      <ResolveDialog
        open={Boolean(resolveId)}
        onCancel={() => setResolveId(null)}
        onConfirm={() => { setCards(prev => prev.map(c => c.id === resolveId ? { ...c, column: 'resolved' } : c)); setResolveId(null); }}
      />
    </Box>
  );
}