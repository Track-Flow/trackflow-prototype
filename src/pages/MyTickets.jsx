import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Button, TextField, InputAdornment } from '@mui/material';
import { tfTickets, getStatus, timeAgo } from '../data/mockData';

const ACCENT  = '#6fdcff';
const PAPER   = '#0f1f3a';
const BORDER  = 'rgba(143,162,192,0.12)';

const MY_TICKETS = tfTickets.filter(t => t.requesterId === 9);

const CAT_COLORS = {
  'IT Support': '#2ec8ff', 'Facilities': '#ffb547',
  'Administration': '#c084fc', 'Library Services': '#2bd48f', 'Other': '#ff9bd0',
};

// ─── Table header ─────────────────────────────────────────────────────────────

function TableHeader() {
  const col = { fontSize: 11, fontWeight: 700, color: '#3a4f6a', textTransform: 'uppercase', letterSpacing: '0.1em' };
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '110px 1fr 200px 140px 100px',
      gap: 2, px: 2.5, py: 1.25,
      borderBottom: `1px solid ${BORDER}`,
      bgcolor: 'rgba(10,22,40,0.4)',
    }}>
      <Typography sx={col}>ID</Typography>
      <Typography sx={col}>Subject</Typography>
      <Typography sx={col}>Department</Typography>
      <Typography sx={col}>Status</Typography>
      <Typography sx={col}>Updated</Typography>
    </Box>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TicketRow({ ticket, onClick }) {
  const s        = getStatus(ticket.status);
  const catColor = CAT_COLORS[ticket.category] ?? '#8fa2c0';
  const isUnrouted = ticket.status === 'unrouted';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 200px 140px 100px',
        alignItems: 'center',
        gap: 2, px: 2.5, py: 1.75,
        borderBottom: `1px solid ${BORDER}`,
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'rgba(111,220,255,0.04)' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* ID */}
      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: '#5b8ec2', fontWeight: 600 }}>
        {ticket.id}
      </Typography>

      {/* Subject */}
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#e6edf7' }} noWrap>
        {ticket.title}
      </Typography>

      {/* Department */}
      {isUnrouted ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75,
          px: 1, py: 0.3, borderRadius: 999,
          bgcolor: 'rgba(255,155,208,0.10)', border: '1px solid rgba(255,155,208,0.2)',
          width: 'fit-content',
        }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ff9bd0' }} />
          <Typography sx={{ fontSize: 11.5, color: '#ff9bd0', fontWeight: 600 }}>Routing…</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75,
          px: 1, py: 0.3, borderRadius: 999,
          bgcolor: `${catColor}18`, border: `1px solid ${catColor}33`,
          width: 'fit-content',
        }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catColor }} />
          <Typography sx={{ fontSize: 11.5, color: catColor, fontWeight: 600 }}>{ticket.category}</Typography>
        </Box>
      )}

      {/* Status */}
      <Box sx={{
        display: 'inline-block', px: 1.25, py: 0.35, borderRadius: 1,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
        bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`,
        width: 'fit-content',
      }}>
        {s.label.toUpperCase()}
      </Box>

      {/* Updated */}
      <Typography sx={{ fontSize: 12, color: '#5b6d8a' }}>
        {timeAgo(ticket.updatedAt)}
      </Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MyTickets({ extraTickets = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const ALL = [...extraTickets.filter(t => t.requesterId === 9), ...MY_TICKETS];

  const displayed = ALL.filter(t => {
    const matchFilter =
      filter === 'active' ? !['resolved', 'closed'].includes(t.status) :
      filter === 'closed' ? ['resolved', 'closed'].includes(t.status) : true;
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTERS = [
    { key: 'all',    label: `All (${ALL.length})` },
    { key: 'active', label: `Active (${ALL.filter(t => !['resolved','closed'].includes(t.status)).length})` },
    { key: 'closed', label: `Resolved (${ALL.filter(t => ['resolved','closed'].includes(t.status)).length})` },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: '#5b6d8a', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          {displayed.length} total
        </Typography>
        <Typography variant="h4" sx={{ color: '#e6edf7', fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>
          My tickets
        </Typography>
      </Box>

      {/* Filter + search bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {FILTERS.map(f => (
            <Button key={f.key} size="small" onClick={() => setFilter(f.key)}
              sx={{
                fontSize: 12, py: 0.5, px: 1.5, borderRadius: 1.5, textTransform: 'none',
                fontWeight: filter === f.key ? 700 : 400,
                color: filter === f.key ? ACCENT : '#8fa2c0',
                bgcolor: filter === f.key ? `${ACCENT}15` : 'transparent',
              }}>
              {f.label}
            </Button>
          ))}
        </Box>
        <TextField
          size="small"
          placeholder="Search tickets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#8fa2c0' }}>search</span>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220, ml: 'auto' }}
        />
        <Button variant="contained" size="small" onClick={() => navigate('/submit')}
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>}
          sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          New ticket
        </Button>
      </Box>

      {/* Table */}
      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <TableHeader />

        {displayed.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#3a4f6a', display: 'block', marginBottom: 12 }}>inbox</span>
            <Typography sx={{ color: '#8fa2c0', mb: 2 }}>No tickets found.</Typography>
            <Button variant="contained" onClick={() => navigate('/submit')}>Submit your first ticket</Button>
          </Box>
        ) : (
          displayed.map(t => (
            <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />
          ))
        )}
      </Card>
    </Box>
  );
}