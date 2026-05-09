import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Button, TextField, InputAdornment, useTheme, useMediaQuery } from '@mui/material';
import { tfTickets, getStatus, timeAgo } from '../data/mockData';

const ACCENT = '#5a8dc4';
const PAPER  = '#111d2e';
const BORDER = 'rgba(148,163,184,0.10)';

const MY_TICKETS = tfTickets.filter(t => t.requesterId === 9);

const CAT_COLORS = {
  'IT Support': '#5a8dc4', 'Facilities': '#c49a4a',
  'Administration': '#7a6fa8', 'Library Services': '#5a8f72', 'Other': '#7a6fa8',
};

// ─── Desktop table header ─────────────────────────────────────────────────────

function TableHeader() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr 170px 130px 90px',
      gap: 2, px: 2.5, py: 1.25,
      borderBottom: `1px solid ${BORDER}`,
      bgcolor: 'rgba(255,255,255,0.02)',
    }}>
      {['ID', 'Subject', 'Department', 'Status', 'Updated'].map(h => (
        <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          {h}
        </Typography>
      ))}
    </Box>
  );
}

// ─── Desktop table row ────────────────────────────────────────────────────────

function TableRow({ ticket, onClick }) {
  const s        = getStatus(ticket.status);
  const catColor = CAT_COLORS[ticket.category] ?? '#94a3b8';

  return (
    <Box onClick={onClick} sx={{
      display: 'grid', gridTemplateColumns: '100px 1fr 170px 130px 90px',
      alignItems: 'center', gap: 2, px: 2.5, py: 1.75,
      borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(90,141,196,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: ACCENT, fontWeight: 600 }}>{ticket.id}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#e3e8f0' }} noWrap>{ticket.title}</Typography>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.3, borderRadius: 999, bgcolor: `${catColor}18`, border: `1px solid ${catColor}33`, width: 'fit-content' }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catColor }} />
        <Typography sx={{ fontSize: 11.5, color: catColor, fontWeight: 600 }} noWrap>{ticket.category}</Typography>
      </Box>
      <Box sx={{ display: 'inline-block', px: 1.25, py: 0.35, borderRadius: 1, fontSize: 10.5, fontWeight: 700, bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, width: 'fit-content' }}>
        {s.label.toUpperCase()}
      </Box>
      <Typography sx={{ fontSize: 12, color: '#64748b' }}>{timeAgo(ticket.updatedAt)}</Typography>
    </Box>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileCard({ ticket, onClick }) {
  const s        = getStatus(ticket.status);
  const catColor = CAT_COLORS[ticket.category] ?? '#94a3b8';

  return (
    <Box onClick={onClick} sx={{
      p: 2, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(90,141,196,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: ACCENT, fontWeight: 600 }}>{ticket.id}</Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.2, borderRadius: 999, bgcolor: `${catColor}18` }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: catColor }} />
            <Typography sx={{ fontSize: 10.5, color: catColor, fontWeight: 600 }}>{ticket.category}</Typography>
          </Box>
        </Box>
        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, fontSize: 10, fontWeight: 700, bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`, flexShrink: 0 }}>
          {s.label.toUpperCase()}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#e3e8f0', mb: 0.5 }}>{ticket.title}</Typography>
      <Typography sx={{ fontSize: 11.5, color: '#64748b' }}>Updated {timeAgo(ticket.updatedAt)}</Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MyTickets({ extraTickets = [] }) {
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const ALL = [...extraTickets.filter(t => t.requesterId === 9), ...MY_TICKETS];

  const displayed = ALL.filter(t => {
    const matchFilter = filter === 'active' ? !['resolved','closed'].includes(t.status) : filter === 'closed' ? ['resolved','closed'].includes(t.status) : true;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTERS = [
    { key: 'all',    label: `All (${ALL.length})` },
    { key: 'active', label: `Active (${ALL.filter(t => !['resolved','closed'].includes(t.status)).length})` },
    { key: 'closed', label: `Resolved (${ALL.filter(t => ['resolved','closed'].includes(t.status)).length})` },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          {displayed.length} total
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: '#e3e8f0', fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>
          My tickets
        </Typography>
      </Box>

      {/* Filter + search */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <Button key={f.key} size="small" onClick={() => setFilter(f.key)} sx={{
              fontSize: 12, py: 0.5, px: 1.25, borderRadius: 1.5, textTransform: 'none',
              fontWeight: filter === f.key ? 700 : 400,
              color: filter === f.key ? ACCENT : '#64748b',
              bgcolor: filter === f.key ? `${ACCENT}15` : 'transparent',
            }}>{f.label}</Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><span className="material-symbols-outlined" style={{ fontSize: 15, color: '#64748b' }}>search</span></InputAdornment> }}
            sx={{ flex: 1, minWidth: { xs: 0, sm: 180 } }}
          />
          <Button variant="contained" size="small" onClick={() => navigate('/submit')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>}
            sx={{ fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {isMobile ? 'New' : 'New ticket'}
          </Button>
        </Box>
      </Box>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        {!isMobile && <TableHeader />}
        {displayed.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#475569', display: 'block', marginBottom: 10 }}>inbox</span>
            <Typography sx={{ color: '#64748b', mb: 2 }}>No tickets found.</Typography>
            <Button variant="contained" onClick={() => navigate('/submit')}>Submit your first ticket</Button>
          </Box>
        ) : isMobile ? (
          displayed.map(t => <MobileCard key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />)
        ) : (
          displayed.map(t => <TableRow key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />)
        )}
      </Card>
    </Box>
  );
}