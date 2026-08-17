import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, TextField, InputAdornment,
  Button, Select, MenuItem, FormControl,
  CircularProgress, Alert, useTheme, useMediaQuery,
} from '@mui/material';
import api from '../helpers/api';
import { statusMeta, timeAgo } from '../helpers/ticketHelpers';

const ACCENT      = '#7a6fa8';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const BORDER      = 'rgba(148,163,184,0.10)';
const PAPER       = '#111d2e';
const PAPER2      = '#0c1422';

const STATUS_OPTIONS = ['open', 'in_progress', 'struggling', 'resolved', 'closed'];
const DEPT_PALETTE   = ['#5a8dc4', '#c49a4a', '#7a6fa8', '#5a8f72', '#8b5e6a'];

// ─── Table header ─────────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: '100px 1fr 180px 130px 100px',
      gap: 2, px: 2.5, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: PAPER2,
    }}>
      {['ID', 'Subject', 'Department', 'Status', 'Updated'].map(h => (
        <Typography key={h} sx={{
          fontSize: 10.5, fontWeight: 700, color: TEXT_DIM,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {h}
        </Typography>
      ))}
    </Box>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function TableRow({ ticket, onClick, deptColor }) {
  const s = statusMeta(ticket.ticket_status);
  const hasDept = !!ticket.department_name;

  return (
    <Box onClick={onClick} sx={{
      display: 'grid', gridTemplateColumns: '100px 1fr 180px 130px 100px',
      alignItems: 'center', gap: 2, px: 2.5, py: 1.75,
      borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(122,111,168,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: ACCENT, fontWeight: 600 }}>
        #{ticket.ticket_id}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>
        {ticket.ticket_title}
      </Typography>
      {!hasDept ? (
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 999,
          bgcolor: 'rgba(122,111,168,0.12)', border: '1px solid rgba(122,111,168,0.25)', width: 'fit-content',
        }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#7a6fa8' }} />
          <Typography sx={{ fontSize: 11, color: '#7a6fa8', fontWeight: 600 }}>Routing…</Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 999,
          bgcolor: `${deptColor}18`, border: `1px solid ${deptColor}33`, width: 'fit-content',
        }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: deptColor }} />
          <Typography sx={{ fontSize: 11, color: deptColor, fontWeight: 600 }} noWrap>
            {ticket.department_name}
          </Typography>
        </Box>
      )}
      <Box sx={{
        display: 'inline-block', px: 1.25, py: 0.3, borderRadius: 1,
        fontSize: 10.5, fontWeight: 700, width: 'fit-content',
        bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`,
      }}>
        {s.label.toUpperCase()}
      </Box>
      <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>
        {timeAgo(ticket.updated_at ?? ticket.created_at)}
      </Typography>
    </Box>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({ ticket, onClick, deptColor }) {
  const s = statusMeta(ticket.ticket_status);
  const hasDept = !!ticket.department_name;
  const color = hasDept ? deptColor : '#7a6fa8';
  const label = hasDept ? ticket.department_name : 'Routing…';

  return (
    <Box onClick={onClick} sx={{
      p: 2, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      '&:hover': { bgcolor: 'rgba(122,111,168,0.05)' },
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: ACCENT, fontWeight: 600 }}>
          #{ticket.ticket_id}
        </Typography>
        <Box sx={{
          px: 1, py: 0.25, borderRadius: 1, fontSize: 10, fontWeight: 700, flexShrink: 0, ml: 1,
          bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`,
        }}>
          {s.label.toUpperCase()}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, mb: 0.5 }}>
        {ticket.ticket_title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color }} />
        <Typography sx={{ fontSize: 11.5, color }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>
        Updated {timeAgo(ticket.updated_at ?? ticket.created_at)}
      </Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManagerAllTickets() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter,   setDeptFilter]   = useState('all');

  useEffect(() => {
    api.get('/api/tickets')
      .then(res => setTickets(res.data))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  // Derive unique departments from tickets + assign stable colors
  const departments = useMemo(() => {
    const map = new Map();
    tickets.forEach(t => {
      if (t.department_id != null && t.department_name && !map.has(t.department_id)) {
        map.set(t.department_id, t.department_name);
      }
    });
    return Array.from(map.entries()).map(([id, name], i) => ({
      id, name, color: DEPT_PALETTE[i % DEPT_PALETTE.length],
    }));
  }, [tickets]);

  const deptColorFor = (id) => departments.find(d => d.id === id)?.color ?? '#94a3b8';

  const displayed = tickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.ticket_status === statusFilter;
    const matchDept =
      deptFilter === 'all' ||
      (deptFilter === 'unrouted' && t.department_id == null) ||
      t.department_id === deptFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.ticket_title?.toLowerCase().includes(q)
      || String(t.ticket_id).includes(q);
    return matchStatus && matchDept && matchSearch;
  });

  const selectSx = {
    fontSize: 12.5,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
    '& .MuiSelect-select': { py: 1 },
  };

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Manager
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>
          All Tickets
        </Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          {tickets.length} total · {displayed.length} shown
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search tickets…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: TEXT_DIM }}>search</span>
              </InputAdornment>
            ),
          }}
          sx={{ flex: '1 1 180px', minWidth: 0 }}
        />
        <FormControl size="small" sx={{ flex: '1 1 130px', minWidth: 0 }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={selectSx}>
            <MenuItem value="all">All statuses</MenuItem>
            {STATUS_OPTIONS.map(s => {
              const meta = statusMeta(s);
              return (
                <MenuItem key={s} value={s}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />
                    {meta.label}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 0 }}>
          <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} sx={selectSx}>
            <MenuItem value="all">All departments</MenuItem>
            <MenuItem value="unrouted">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#7a6fa8' }} />
                Unrouted
              </Box>
            </MenuItem>
            {departments.map(d => (
              <MenuItem key={d.id} value={d.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: d.color }} />
                  {d.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {(search || statusFilter !== 'all' || deptFilter !== 'all') && (
          <Button size="small"
            onClick={() => { setSearch(''); setStatusFilter('all'); setDeptFilter('all'); }}
            sx={{ fontSize: 12, color: TEXT_DIM, whiteSpace: 'nowrap' }}
          >
            Clear
          </Button>
        )}
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
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#475569', display: 'block', marginBottom: 10 }}>inbox</span>
            <Typography sx={{ color: TEXT_DIM }}>
              {tickets.length === 0 ? 'No tickets yet.' : 'No tickets match your filters.'}
            </Typography>
          </Box>
        )}

        {!loading && displayed.length > 0 && (
          isMobile
            ? displayed.map(t => (
                <MobileCard key={t.ticket_id} ticket={t}
                  deptColor={deptColorFor(t.department_id)}
                  onClick={() => navigate(`/tickets/${t.ticket_id}`)} />
              ))
            : displayed.map(t => (
                <TableRow key={t.ticket_id} ticket={t}
                  deptColor={deptColorFor(t.department_id)}
                  onClick={() => navigate(`/tickets/${t.ticket_id}`)} />
              ))
        )}
      </Card>
    </Box>
  );
}