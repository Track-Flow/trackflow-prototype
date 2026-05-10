import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, TextField, InputAdornment,
  Button, Select, MenuItem, FormControl, useTheme, useMediaQuery,
} from '@mui/material';
import { tfDepartments, getStatus, timeAgo } from '../data/mockData';
import { useTickets } from '../context/TicketContext';

const ACCENT      = '#7a6fa8';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const BORDER      = 'rgba(148,163,184,0.10)';
const PAPER       = '#111d2e';
const PAPER2      = '#0c1422';

const CAT_COLORS = { 'IT Support': '#5a8dc4', 'Facilities': '#c49a4a', 'Administration': '#7a6fa8', 'Library Services': '#5a8f72', 'Other': '#7a6fa8' };

function TableHeader() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 110px 110px 90px', gap: 2, px: 2.5, py: 1.25, borderBottom: `1px solid ${BORDER}`, bgcolor: PAPER2 }}>
      {['ID', 'Subject', 'Department', 'Status', 'Updated'].map(h => (
        <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</Typography>
      ))}
    </Box>
  );
}

function TableRow({ ticket, onClick }) {
  const s        = getStatus(ticket.status);
  const catColor = CAT_COLORS[ticket.category] ?? '#94a3b8';
  return (
    <Box onClick={onClick} sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 110px 110px 90px', alignItems: 'center', gap: 2, px: 2.5, py: 1.75, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(122,111,168,0.05)' }, '&:last-child': { borderBottom: 'none' } }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: ACCENT, fontWeight: 600 }}>{ticket.id}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>{ticket.title}</Typography>
      {ticket.status === 'unrouted' ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 999, bgcolor: 'rgba(122,111,168,0.12)', border: '1px solid rgba(122,111,168,0.2)', width: 'fit-content' }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#7a6fa8' }} />
          <Typography sx={{ fontSize: 11, color: '#7a6fa8', fontWeight: 600 }}>Routing…</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 999, bgcolor: `${catColor}18`, border: `1px solid ${catColor}33`, width: 'fit-content' }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: catColor }} />
          <Typography sx={{ fontSize: 11, color: catColor, fontWeight: 600 }}>{ticket.category}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'inline-block', px: 1.25, py: 0.3, borderRadius: 1, fontSize: 10.5, fontWeight: 700, bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, width: 'fit-content' }}>
        {s.label.toUpperCase()}
      </Box>
      <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>{timeAgo(ticket.updatedAt)}</Typography>
    </Box>
  );
}

function MobileCard({ ticket, onClick }) {
  const s        = getStatus(ticket.status);
  const catColor = CAT_COLORS[ticket.category] ?? '#94a3b8';
  return (
    <Box onClick={onClick} sx={{ p: 2, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(122,111,168,0.05)' }, '&:last-child': { borderBottom: 'none' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: ACCENT, fontWeight: 600 }}>{ticket.id}</Typography>
        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, fontSize: 10, fontWeight: 700, bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`, flexShrink: 0, ml: 1 }}>
          {s.label.toUpperCase()}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, mb: 0.5 }}>{ticket.title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: catColor }} />
        <Typography sx={{ fontSize: 11.5, color: catColor }}>{ticket.category}</Typography>
      </Box>
      <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>Updated {timeAgo(ticket.updatedAt)}</Typography>
    </Box>
  );
}

export default function ManagerAllTickets({ extraTickets = [] }) {
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
  const { tickets } = useTickets();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter,   setDeptFilter]   = useState('all');

  const ALL = [...extraTickets, ...tickets];

  const displayed = ALL.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchDept   = deptFilter === 'all' || t.dept === deptFilter || (deptFilter === 'unrouted' && !t.dept);
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  });

  const selectSx = { fontSize: 12.5, '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '& .MuiSelect-select': { py: 1 } };

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>MSS Manager</Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT }}>All Tickets</Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>{ALL.length} total · {displayed.length} shown</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search tickets…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><span className="material-symbols-outlined" style={{ fontSize: 15, color: TEXT_DIM }}>search</span></InputAdornment> }}
          sx={{ flex: '1 1 180px', minWidth: 0 }}
        />
        <FormControl size="small" sx={{ flex: '1 1 130px', minWidth: 0 }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={selectSx}>
            <MenuItem value="all">All statuses</MenuItem>
            {['open', 'in_progress', 'pending', 'unrouted', 'resolved', 'closed'].map(s => {
              const meta = getStatus(s);
              return <MenuItem key={s} value={s}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />{meta.label}</Box></MenuItem>;
            })}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 0 }}>
          <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} sx={selectSx}>
            <MenuItem value="all">All departments</MenuItem>
            <MenuItem value="unrouted">Unrouted</MenuItem>
            {tfDepartments.map(d => (
              <MenuItem key={d.id} value={d.id}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: d.color }} />{d.name}</Box></MenuItem>
            ))}
          </Select>
        </FormControl>
        {(search || statusFilter !== 'all' || deptFilter !== 'all') && (
          <Button size="small" onClick={() => { setSearch(''); setStatusFilter('all'); setDeptFilter('all'); }} sx={{ fontSize: 12, color: TEXT_DIM, whiteSpace: 'nowrap' }}>Clear</Button>
        )}
      </Box>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        {!isMobile && <TableHeader />}
        {displayed.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#475569', display: 'block', marginBottom: 10 }}>inbox</span>
            <Typography sx={{ color: TEXT_DIM }}>No tickets match your filters.</Typography>
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