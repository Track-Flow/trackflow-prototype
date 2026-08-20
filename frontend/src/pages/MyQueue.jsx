// ─── MyQueue.jsx ────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, Typography, TextField, InputAdornment,
  CircularProgress, Alert, useTheme, useMediaQuery,
} from '@mui/material';
import api from '../helpers/api';
import { statusMeta, timeAgo } from '../helpers/ticketHelpers';

const ACCENT      = '#5a8dc4';
const PAPER       = '#111d2e';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

const STATUS_FILTERS = [
  { key: 'all',          label: 'All'          },
  { key: 'open',         label: 'Open'         },
  { key: 'in_progress',  label: 'In Progress'  },
  { key: 'struggling',   label: 'Struggling'   },
  { key: 'resolved',     label: 'Resolved'     },
  { key: 'closed',       label: 'Closed'       },
];

const VALID_STATUS_KEYS = new Set(STATUS_FILTERS.map(f => f.key));

function sortByMostRecentlyUpdated(list) {
  return [...list].sort((a, b) => new Date(b.ticket_updated_at) - new Date(a.ticket_updated_at));
}

// ─── Table header ─────────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '90px 1fr 110px 100px',
      gap: 2, px: 2.5, py: 1.25,
      borderBottom: `1px solid ${BORDER}`,
      bgcolor: 'rgba(255,255,255,0.02)',
    }}>
      {['Ticket', 'Subject', 'Status', 'Updated'].map(h => (
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

  return (
    <Box onClick={onClick} sx={{
      display: 'grid', gridTemplateColumns: '90px 1fr 110px 100px',
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
        display: 'inline-block', px: 1.25, py: 0.35, borderRadius: 1, width: 'fit-content',
        fontSize: 10.5, fontWeight: 700,
        bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`,
      }}>
        {s.label.toUpperCase()}
      </Box>
      <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>
        {timeAgo(ticket.ticket_updated_at ?? ticket.ticket_created_at)}
      </Typography>
    </Box>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({ ticket, onClick }) {
  const s = statusMeta(ticket.ticket_status);

  return (
    <Box onClick={onClick} sx={{
      p: 2, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(90,141,196,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: ACCENT, fontWeight: 600 }}>
          #{ticket.ticket_id}
        </Typography>
        <Box sx={{
          px: 0.9, py: 0.2, borderRadius: 1, fontSize: 9.5, fontWeight: 700,
          bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`,
        }}>
          {s.label.toUpperCase()}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, mb: 0.5 }}>
        {ticket.ticket_title}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED }}>
        Updated {timeAgo(ticket.ticket_updated_at ?? ticket.ticket_created_at)}
      </Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyQueue() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user     = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');
  const initialStatus = VALID_STATUS_KEYS.has(urlStatus) ? urlStatus : 'all';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState(initialStatus);

  useEffect(() => {
    api.get('/tickets')
      .then(res => {
        const mine = res.data.filter(t => (t.assigned_user_id ?? t.assignee_id) === user?.id);
        setTickets(sortByMostRecentlyUpdated(mine));
      })
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  // Keep the URL in sync with the chosen filter so links/refreshes preserve it
  const selectStatus = (key) => {
    setStatus(key);
    if (key === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: key });
    }
  };

  const displayed = tickets.filter(t => {
    const matchStatus = status === 'all' || t.ticket_status === status;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || String(t.ticket_id).includes(q);
    return matchStatus && matchSearch;
  });

  const statusCounts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? tickets.length : tickets.filter(t => t.ticket_status === f.key).length;
    return acc;
  }, {});

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
          My queue
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <Box
              key={f.key}
              onClick={() => selectStatus(f.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.6, cursor: 'pointer',
                fontSize: 12, py: 0.5, px: 1.25, borderRadius: 1.5,
                fontWeight: status === f.key ? 700 : 400,
                color: status === f.key ? ACCENT : TEXT_MUTED,
                bgcolor: status === f.key ? `${ACCENT}15` : 'transparent',
                '&:hover': { bgcolor: status === f.key ? `${ACCENT}15` : 'rgba(148,163,184,0.06)' },
              }}
            >
              {f.label}
              <Box sx={{
                px: 0.6, py: 0.05, borderRadius: 999,
                bgcolor: status === f.key ? ACCENT : '#1a2d4a',
                fontSize: 10, fontWeight: 700,
                color: status === f.key ? '#0a1628' : TEXT_MUTED,
              }}>
                {statusCounts[f.key]}
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 220 } }}>
          <TextField
            size="small" placeholder="Search by ticket #…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: TEXT_MUTED }}>search</span>
                </InputAdornment>
              ),
            }}
            sx={{ width: '100%' }}
          />
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
            <Typography sx={{ color: TEXT_MUTED }}>
              {tickets.length === 0 ? 'No tickets assigned to you yet.' : 'No tickets match your filters.'}
            </Typography>
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