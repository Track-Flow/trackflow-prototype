import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Button, TextField, InputAdornment,
  CircularProgress, Alert, useTheme, useMediaQuery,
} from '@mui/material';
import api from '../helpers/api';
import { statusMeta, timeAgo, getUserTickets } from '../helpers/ticketHelpers';

const ACCENT      = '#5a8dc4';
const PAPER       = '#111d2e';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

// ─── Table header ─────────────────────────────────────────────────────────────
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
        <Typography key={h} sx={{
          fontSize: 10.5, fontWeight: 700, color: TEXT_MUTED,
          textTransform: 'uppercase', letterSpacing: '0.09em',
        }}>
          {h}
        </Typography>
      ))}
    </Box>
  );
}

// ─── Table row (desktop) ──────────────────────────────────────────────────────
function TableRow({ ticket, onClick }) {
  const s = statusMeta(ticket.ticket_status);
  const hasDept = !!ticket.department_name;

  return (
    <Box onClick={onClick} sx={{
      display: 'grid', gridTemplateColumns: '100px 1fr 170px 130px 90px',
      alignItems: 'center', gap: 2, px: 2.5, py: 1.75,
      borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(90,141,196,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: ACCENT, fontWeight: 600 }}>
        #{ticket.ticket_id}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>
        {ticket.ticket_title}
      </Typography>
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75,
        px: 1, py: 0.3, borderRadius: 999, width: 'fit-content',
        bgcolor: hasDept ? 'rgba(90,141,196,0.10)' : 'rgba(139,94,106,0.10)',
        border: `1px solid ${hasDept ? 'rgba(90,141,196,0.25)' : 'rgba(139,94,106,0.25)'}`,
      }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: hasDept ? ACCENT : '#8b5e6a' }} />
        <Typography sx={{
          fontSize: 11.5, fontWeight: 600,
          color: hasDept ? ACCENT : '#8b5e6a',
        }} noWrap>
          {hasDept ? ticket.department_name : 'Routing…'}
        </Typography>
      </Box>
      <Box sx={{
        display: 'inline-block', px: 1.25, py: 0.35, borderRadius: 1,
        fontSize: 10.5, fontWeight: 700, width: 'fit-content',
        bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`,
      }}>
        {s.label.toUpperCase()}
      </Box>
      <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>
        {timeAgo(ticket.updated_at ?? ticket.created_at)}
      </Typography>
    </Box>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({ ticket, onClick }) {
  const s = statusMeta(ticket.ticket_status);
  const hasDept = !!ticket.department_name;

  return (
    <Box onClick={onClick} sx={{
      p: 2, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(90,141,196,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: ACCENT, fontWeight: 600 }}>
            #{ticket.ticket_id}
          </Typography>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 0.75, py: 0.2, borderRadius: 999,
            bgcolor: hasDept ? 'rgba(90,141,196,0.10)' : 'rgba(139,94,106,0.10)',
          }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: hasDept ? ACCENT : '#8b5e6a' }} />
            <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: hasDept ? ACCENT : '#8b5e6a' }}>
              {hasDept ? ticket.department_name : 'Routing…'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{
          px: 1, py: 0.25, borderRadius: 1, fontSize: 10, fontWeight: 700, flexShrink: 0,
          bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`,
        }}>
          {s.label.toUpperCase()}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, mb: 0.5 }}>
        {ticket.ticket_title}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED }}>
        Updated {timeAgo(ticket.updated_at ?? ticket.created_at)}
      </Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyTickets() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user     = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    api.get('/tickets')
      .then(res => setTickets(getUserTickets(res.data, user?.id)))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  const displayed = tickets.filter(t => {
    const matchFilter = filter === 'active'
      ? !['resolved', 'closed'].includes(t.ticket_status)
      : filter === 'closed'
      ? ['resolved', 'closed'].includes(t.ticket_status)
      : true;
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.ticket_title?.toLowerCase().includes(q)
      || String(t.ticket_id).includes(q);
    return matchFilter && matchSearch;
  });

  const FILTERS = [
    { key: 'all',    label: `All (${tickets.length})` },
    { key: 'active', label: `Active (${tickets.filter(t => !['resolved', 'closed'].includes(t.ticket_status)).length})` },
    { key: 'closed', label: `Resolved (${tickets.filter(t => ['resolved', 'closed'].includes(t.ticket_status)).length})` },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{
          fontSize: 10.5, color: TEXT_MUTED, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5,
        }}>
          {displayed.length} total
        </Typography>
        <Typography variant="h4" sx={{
          fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT,
          fontFamily: '"Rubik", sans-serif', fontWeight: 700,
        }}>
          My tickets
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <Button key={f.key} size="small" onClick={() => setFilter(f.key)} sx={{
              fontSize: 12, py: 0.5, px: 1.25, borderRadius: 1.5, textTransform: 'none',
              fontWeight: filter === f.key ? 700 : 400,
              color: filter === f.key ? ACCENT : TEXT_MUTED,
              bgcolor: filter === f.key ? `${ACCENT}15` : 'transparent',
            }}>
              {f.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: TEXT_MUTED }}>search</span>
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: { xs: 0, sm: 180 } }}
          />
          <Button
            variant="contained" size="small"
            onClick={() => navigate('/submit')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>}
            sx={{ fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {isMobile ? 'New' : 'New ticket'}
          </Button>
        </Box>
      </Box>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        {!isMobile && <TableHeader />}

        {loading && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        )}

        {!loading && displayed.length === 0 && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 36, color: '#475569', display: 'block', marginBottom: 10,
            }}>inbox</span>
            <Typography sx={{ color: TEXT_MUTED, mb: 2 }}>
              {tickets.length === 0 ? 'No tickets yet.' : 'No tickets match your filters.'}
            </Typography>
            {tickets.length === 0 && (
              <Button variant="contained" onClick={() => navigate('/submit')}>
                Submit your first ticket
              </Button>
            )}
          </Box>
        )}

        {!loading && displayed.length > 0 && (
          isMobile
            ? displayed.map(t => (
                <MobileCard key={t.ticket_id} ticket={t}
                  onClick={() => navigate(`/tickets/${t.ticket_id}`)} />
              ))
            : displayed.map(t => (
                <TableRow key={t.ticket_id} ticket={t}
                  onClick={() => navigate(`/tickets/${t.ticket_id}`)} />
              ))
        )}
      </Card>
    </Box>
  );
}