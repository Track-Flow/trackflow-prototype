import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, TextField, InputAdornment,
  Button, Select, MenuItem, FormControl,
} from '@mui/material';
import { tfTickets, tfDepartments, getStatus, getPriority, timeAgo } from '../data/mockData';

const ACCENT     = '#ff9bd0';
const PAPER      = '#0f1f3a';
const BORDER     = 'rgba(143,162,192,0.12)';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';

const CAT_COLORS = {
  'IT Support': '#2ec8ff', 'Facilities': '#ffb547',
  'Administration': '#c084fc', 'Library Services': '#2bd48f', 'Other': '#ff9bd0',
};

function TableHeader() {
  const col = { fontSize: 11, fontWeight: 700, color: '#3a4f6a', textTransform: 'uppercase', letterSpacing: '0.1em' };
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '110px 1fr 180px 130px 120px 100px',
      gap: 2, px: 2.5, py: 1.25,
      borderBottom: `1px solid ${BORDER}`,
      bgcolor: 'rgba(10,22,40,0.4)',
    }}>
      <Typography sx={col}>ID</Typography>
      <Typography sx={col}>Subject</Typography>
      <Typography sx={col}>Department</Typography>
      <Typography sx={col}>Priority</Typography>
      <Typography sx={col}>Status</Typography>
      <Typography sx={col}>Updated</Typography>
    </Box>
  );
}

function TicketRow({ ticket, onClick }) {
  const s        = getStatus(ticket.status);
  const p        = getPriority(ticket.priority);
  const catColor = CAT_COLORS[ticket.category] ?? '#8fa2c0';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 180px 130px 120px 100px',
        alignItems: 'center',
        gap: 2, px: 2.5, py: 1.75,
        borderBottom: `1px solid ${BORDER}`,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'rgba(255,155,208,0.04)' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: '#5b8ec2', fontWeight: 600 }}>
        {ticket.id}
      </Typography>

      <Typography sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>
        {ticket.title}
      </Typography>

      {ticket.status === 'unrouted' ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.3, borderRadius: 999, bgcolor: 'rgba(255,155,208,0.10)', border: '1px solid rgba(255,155,208,0.2)', width: 'fit-content' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ff9bd0' }} />
          <Typography sx={{ fontSize: 11.5, color: '#ff9bd0', fontWeight: 600 }}>Routing…</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.3, borderRadius: 999, bgcolor: `${catColor}18`, border: `1px solid ${catColor}33`, width: 'fit-content' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catColor }} />
          <Typography sx={{ fontSize: 11.5, color: catColor, fontWeight: 600 }}>{ticket.category}</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: p.color }} />
        <Typography sx={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.label}</Typography>
      </Box>

      <Box sx={{ display: 'inline-block', px: 1.25, py: 0.35, borderRadius: 1, fontSize: 11, fontWeight: 700, bgcolor: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, width: 'fit-content' }}>
        {s.label.toUpperCase()}
      </Box>

      <Typography sx={{ fontSize: 12, color: TEXT_DIM }}>
        {timeAgo(ticket.updatedAt)}
      </Typography>
    </Box>
  );
}

export default function ManagerAllTickets({ extraTickets = [] }) {
  const navigate = useNavigate();
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter,   setDeptFilter]   = useState('all');

  const ALL = [...extraTickets, ...tfTickets];

  const displayed = ALL.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchDept   = deptFilter === 'all' || t.dept === deptFilter || (deptFilter === 'unrouted' && !t.dept);
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  });

  const statuses = ['open', 'in_progress', 'pending', 'unrouted', 'resolved', 'closed'];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Manager
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>All Tickets</Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          {ALL.length} total · {displayed.length} shown
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search tickets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: TEXT_DIM }}>search</span>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            sx={{ fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
            <MenuItem value="all">All statuses</MenuItem>
            {statuses.map(s => {
              const meta = getStatus(s);
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

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            sx={{ fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER } }}>
            <MenuItem value="all">All departments</MenuItem>
            <MenuItem value="unrouted">Unrouted</MenuItem>
            {tfDepartments.map(d => (
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
          <Button size="small" onClick={() => { setSearch(''); setStatusFilter('all'); setDeptFilter('all'); }}
            sx={{ fontSize: 12, color: TEXT_DIM }}>
            Clear filters
          </Button>
        )}
      </Box>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <TableHeader />
        {displayed.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#3a4f6a', display: 'block', marginBottom: 12 }}>inbox</span>
            <Typography sx={{ color: TEXT_DIM }}>No tickets match your filters.</Typography>
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