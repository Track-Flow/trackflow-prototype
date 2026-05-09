import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Button, Avatar,
  Select, MenuItem, FormControl, Alert,
} from '@mui/material';
import { tfTickets, tfDepartments, timeAgo, getUser } from '../data/mockData';

const ACCENT     = '#ffb547';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';

const UNROUTED = tfTickets.filter(t => t.status === 'unrouted');

const DEPT_OPTIONS = [
  { value: '', label: 'Select department…' },
  ...tfDepartments.map(d => ({ value: d.id, label: d.name, color: d.color })),
];

function UnroutedCard({ ticket, onRoute }) {
  const navigate        = useNavigate();
  const [dept, setDept] = useState('');
  const [routed, setRouted] = useState(false);
  const requester       = getUser(ticket.requesterId);

  function handleRoute() {
    if (!dept) return;
    setRouted(true);
    onRoute(ticket.id, dept);
  }

  if (routed) {
    const deptName = tfDepartments.find(d => d.id === dept)?.name ?? dept;
    return (
      <Card sx={{ p: 2.5, mb: 2, border: '1px solid rgba(43,212,143,0.3)', background: 'rgba(43,212,143,0.04)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#2bd48f', fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#2bd48f' }}>
              {ticket.id} routed to {deptName}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>{ticket.title}</Typography>
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 2.5, mb: 2, border: `1px solid ${BORDER}`, transition: 'border 0.15s', '&:hover': { border: `1px solid ${ACCENT}33` } }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5, gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2' }}>{ticket.id}</Typography>
            <Chip label="UNROUTED" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(255,155,208,0.15)', color: '#ff9bd0', border: '1px solid rgba(255,155,208,0.3)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: p.color }} />
            </Box>
          </Box>
          <Typography
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            sx={{ fontSize: 14, fontWeight: 700, color: TEXT_BRIGHT, cursor: 'pointer', '&:hover': { color: ACCENT }, mb: 0.5 }}
          >
            {ticket.title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.5 }}>
            {ticket.description}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
          <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{timeAgo(ticket.createdAt)}</Typography>
        </Box>
      </Box>

      {/* Requester */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: `1px solid ${BORDER}` }}>
        <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: `${requester?.color ?? '#8fa2c0'}20`, color: requester?.color }}>
          {requester?.initials}
        </Avatar>
        <Typography sx={{ fontSize: 12, color: TEXT_DIM }}>
          {requester?.name ?? 'Unknown'} · {requester?.sub ?? 'End User'}
        </Typography>
      </Box>

      {/* Routing controls */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12, color: TEXT_DIM, flexShrink: 0 }}>Route to:</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={dept}
            onChange={e => setDept(e.target.value)}
            displayEmpty
            sx={{
              fontSize: 12.5,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT + '66' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
            }}
          >
            <MenuItem value="" disabled>
              <Typography sx={{ fontSize: 12.5, color: TEXT_DIM }}>Select department…</Typography>
            </MenuItem>
            {tfDepartments.map(d => (
              <MenuItem key={d.id} value={d.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                  <Typography sx={{ fontSize: 12.5 }}>{d.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size="small"
          disabled={!dept}
          onClick={handleRoute}
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>alt_route</span>}
          sx={{
            fontSize: 12, py: 0.75,
            background: dept ? `linear-gradient(135deg, ${ACCENT}, #e09030)` : undefined,
            color: dept ? '#070f1c' : undefined,
          }}
        >
          Route ticket
        </Button>
      </Box>
    </Card>
  );
}

export default function HelpdeskHome({ extraTickets = [] }) {
  const allUnrouted = [
    ...extraTickets.filter(t => t.status === 'unrouted'),
    ...UNROUTED,
  ];
  const [tickets, setTickets] = useState(allUnrouted);
  const [routed,  setRouted]  = useState([]);

  function handleRoute(id, dept) {
    setRouted(prev => [...prev, id]);
  }

  const pending = tickets.filter(t => !routed.includes(t.id));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          Help Desk Admin
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>Unrouted Queue</Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          Tickets submitted under "Other" — manually assign each to the correct department.
        </Typography>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending routing', value: pending.length,  color: '#ff9bd0' },
          { label: 'Routed today',    value: routed.length,   color: '#2bd48f' },
          { label: 'Total unrouted',  value: tickets.length,  color: ACCENT    },
        ].map(s => (
          <Card key={s.label} sx={{ flex: '1 1 140px', p: 2 }}>
            <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              {s.label}
            </Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: '"Rubik", sans-serif' }}>
              {s.value}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* How it works */}
      <Alert
        severity="info"
        icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>}
        sx={{ mb: 3, background: 'rgba(46,200,255,0.06)', border: '1px solid rgba(46,200,255,0.15)', color: TEXT_DIM, fontSize: 12.5 }}
      >
        Tickets appear here when a user selects <strong style={{ color: TEXT_BRIGHT }}>Other</strong> as their category.
        The system cannot auto-route these — select the correct department and click Route ticket.
      </Alert>

      {/* Queue */}
      {pending.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#2bd48f', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>
            done_all
          </span>
          <Typography variant="h6" sx={{ color: TEXT_BRIGHT, mb: 0.5 }}>Queue is clear!</Typography>
          <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>All unrouted tickets have been assigned.</Typography>
        </Card>
      ) : (
        tickets.map(t => (
          <UnroutedCard key={t.id} ticket={t} onRoute={handleRoute} />
        ))
      )}
    </Box>
  );
}