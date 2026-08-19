import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress,
} from '@mui/material';
import api from '../helpers/api';
import {
  statusMeta, timeAgo,
  countByStatus, getSLABreaches, getResolvedToday,
} from '../helpers/ticketHelpers';

const ACCENT      = '#7a6fa8';
const PAPER       = '#111d2e';
const PAPER2      = '#0c1422';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

const DEPT_COLORS = ['#5a8dc4', '#c49a4a', '#7a6fa8', '#5a8f72', '#8b5e6a'];

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon, sub }) {
  return (
    <Card sx={{ flex: '1 1 130px', p: { xs: 1.75, md: 2.5 }, bgcolor: PAPER, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>{icon}</span>
      </Box>
      <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: TEXT_DIM, mt: 0.5 }}>{sub}</Typography>}
    </Card>
  );
}

// ─── Department load bar ──────────────────────────────────────────────────────
function DeptBar({ dept }) {
  const total = dept.open + dept.resolved;
  const pct   = total > 0 ? Math.round((dept.resolved / total) * 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dept.color }} />
          <Typography sx={{ fontSize: 12.5, color: TEXT_BRIGHT, fontWeight: 600 }}>{dept.name}</Typography>
          {dept.breach > 0 && (
            <Chip label={`${dept.breach} breach`} size="small"
              sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(184,92,82,0.15)', color: '#b85c52' }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Typography sx={{ fontSize: 11, color: '#c49a4a' }}>{dept.open} open</Typography>
          <Typography sx={{ fontSize: 11, color: '#5a8f72' }}>{dept.resolved} resolved</Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={{
        height: 5, borderRadius: 3,
        bgcolor: 'rgba(148,163,184,0.1)',
        '& .MuiLinearProgress-bar': { bgcolor: dept.color, borderRadius: 3 },
      }} />
    </Box>
  );
}

// ─── Live activity item (derived from tickets) ────────────────────────────────
function ActivityItem({ ticket }) {
  const iconMap = {
    open:        { icon: 'add_circle',   color: '#5a8dc4', verb: 'opened'        },
    in_progress: { icon: 'sync',         color: '#c49a4a', verb: 'started work on' },
    struggling:  { icon: 'flag',         color: '#8b5e6a', verb: 'flagged'       },
    resolved:    { icon: 'check_circle', color: '#5a8f72', verb: 'resolved'      },
    closed:      { icon: 'lock',         color: '#475569', verb: 'closed'        },
  };
  const meta = iconMap[ticket.ticket_status] ?? { icon: 'info', color: '#64748b', verb: 'updated' };
  const who  = ticket.assignee_name ?? ticket.user_name ?? 'Someone';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.75 }}>
      <Box sx={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        bgcolor: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: meta.color, fontVariationSettings: "'FILL' 1" }}>
          {meta.icon}
        </span>
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT, lineHeight: 1.5 }}>
          <strong>{who}</strong> {meta.verb}{' '}
          <span style={{ fontFamily: 'monospace', color: '#5b8ec2' }}>#{ticket.ticket_id}</span>
        </Typography>
        <Typography sx={{ fontSize: 11, color: TEXT_DIM }} noWrap>
          {ticket.ticket_title} · {timeAgo(ticket.updated_at ?? ticket.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManagerHome() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/tickets')
      .then(res => setTickets(res.data))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  const counts        = countByStatus(tickets);
  const breaches      = getSLABreaches(tickets);
  const resolvedToday = getResolvedToday(tickets);
  const unrouted      = tickets.filter(t => t.department_id == null);

  // Recent tickets (last updated first)
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at) - new Date(a.updated_at ?? a.created_at))
    .slice(0, 6);

  // Live activity — latest updated tickets
  const activity = [...tickets]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at) - new Date(a.updated_at ?? a.created_at))
    .slice(0, 8);

  // Derive department load from tickets
  const deptMap = {};
  tickets.forEach(t => {
    const name = t.department_name ?? 'Unrouted';
    if (!deptMap[name]) deptMap[name] = { name, open: 0, resolved: 0, breach: 0 };
    if (['resolved', 'closed'].includes(t.ticket_status)) deptMap[name].resolved += 1;
    else deptMap[name].open += 1;
  });
  breaches.forEach(t => {
    const name = t.department_name ?? 'Unrouted';
    if (deptMap[name]) deptMap[name].breach += 1;
  });
  const deptLoad = Object.values(deptMap).map((d, i) => ({
    ...d, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Operations
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>
          University-wide overview
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* KPIs */}
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard label="Open"           value={counts.open ?? 0}        color="#5a8dc4" icon="radio_button_unchecked" />
        <KpiCard label="In Progress"    value={counts.in_progress ?? 0} color="#c49a4a" icon="pending" />
        <KpiCard label="Struggling"     value={counts.struggling ?? 0}  color="#8b5e6a" icon="flag" />
        <KpiCard label="Resolved today" value={resolvedToday.length}    color="#5a8f72" icon="check_circle" />
        <KpiCard label="SLA Breaches"   value={breaches.length}         color="#b85c52" icon="warning"
          sub={breaches.length > 0 ? 'Needs attention' : 'All on track'} />
        <KpiCard label="Unrouted"       value={unrouted.length}         color="#7a6fa8" icon="alt_route" sub="Pending help desk" />
      </Box>

      <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Recent tickets */}
        <Card sx={{ flex: '1 1 100%', p: { xs: 2, md: 3 }, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Recent tickets</Typography>
            <Button size="small" onClick={() => navigate('/manager/tickets')}
              endIcon={<span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>}
              sx={{ fontSize: 11, color: ACCENT }}>
              View all
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={24} sx={{ color: ACCENT }} />
            </Box>
          ) : recentTickets.length === 0 ? (
            <Typography sx={{ color: TEXT_DIM, textAlign: 'center', py: 3 }}>No tickets yet.</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    {['Ticket Number', 'Title', 'Dept', 'Status', 'Updated'].map(h => (
                      <TableCell key={h} sx={{
                        fontSize: 10.5, fontWeight: 700, color: TEXT_DIM,
                        borderColor: BORDER, textTransform: 'uppercase', letterSpacing: '0.08em',
                        pb: 1, bgcolor: PAPER2, whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTickets.map(t => {
                    const s = statusMeta(t.ticket_status);
                    return (
                      <TableRow key={t.ticket_id}
                        onClick={() => navigate(`/tickets/${t.ticket_id}`)}
                        sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(122,111,168,0.05)' } }}
                      >
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: ACCENT, borderColor: BORDER, whiteSpace: 'nowrap' }}>
                          #{t.ticket_id}
                        </TableCell>
                        <TableCell sx={{ borderColor: BORDER, maxWidth: 180 }}>
                          <Typography noWrap sx={{ fontSize: 12.5, color: TEXT_BRIGHT }}>{t.ticket_title}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: BORDER }}>
                          <Typography sx={{
                            fontSize: 11, whiteSpace: 'nowrap',
                            color: t.department_name ? TEXT_DIM : '#8b5e6a',
                          }}>
                            {t.department_name ?? 'Unrouted'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: BORDER }}>
                          <Chip label={s.label} size="small"
                            sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: `${s.color}20`, color: s.color }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: TEXT_DIM, borderColor: BORDER, whiteSpace: 'nowrap' }}>
                          {timeAgo(t.updated_at ?? t.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>

        {/* Dept load + activity */}
        <Box sx={{ display: 'flex', gap: { xs: 2, md: 2 }, flexWrap: 'wrap', flex: '1 1 100%' }}>
          <Card sx={{ flex: '1 1 260px', p: { xs: 2, md: 3 }, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Department load</Typography>
              <Button size="small" onClick={() => navigate('/manager/reports')} sx={{ fontSize: 11, color: ACCENT }}>
                Reports →
              </Button>
            </Box>
            {loading ? (
              <CircularProgress size={20} sx={{ color: ACCENT }} />
            ) : deptLoad.length === 0 ? (
              <Typography sx={{ color: TEXT_DIM, fontSize: 12 }}>No data.</Typography>
            ) : (
              deptLoad.map(d => <DeptBar key={d.name} dept={d} />)
            )}
          </Card>

          <Card sx={{ flex: '1 1 260px', p: { xs: 2, md: 3 }, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Live activity</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ACCENT }} />
                <Typography sx={{ fontSize: 10, color: ACCENT, fontWeight: 700 }}>LIVE</Typography>
              </Box>
            </Box>
            {loading ? (
              <CircularProgress size={20} sx={{ color: ACCENT }} />
            ) : activity.length === 0 ? (
              <Typography sx={{ color: TEXT_DIM, fontSize: 12 }}>No activity yet.</Typography>
            ) : (
              activity.map(t => <ActivityItem key={t.ticket_id} ticket={t} />)
            )}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}