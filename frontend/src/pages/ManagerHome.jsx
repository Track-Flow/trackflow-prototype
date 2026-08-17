import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress,
} from '@mui/material';
import { tfTickets, tfDeptLoad, tfActivity, getStatus, timeAgo, getUser } from '../data/mockData';

const ACCENT     = '#7a6fa8';
const TEXT_DIM   = '#94a3b8';
const TEXT_BRIGHT= '#e3e8f0';
const BORDER     = 'rgba(148,163,184,0.10)';
const PAPER      = '#111d2e';
const PAPER2     = '#0c1422';

function KpiCard({ label, value, color, icon, sub }) {
  return (
    <Card sx={{ flex: '1 1 130px', p: { xs: 1.75, md: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</Typography>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>{icon}</span>
      </Box>
      <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 11, color: TEXT_DIM, mt: 0.5 }}>{sub}</Typography>}
    </Card>
  );
}

function DeptBar({ dept }) {
  const total = dept.open + dept.resolved;
  const pct   = total > 0 ? Math.round((dept.resolved / total) * 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dept.color }} />
          <Typography sx={{ fontSize: 12.5, color: TEXT_BRIGHT, fontWeight: 600 }}>{dept.name}</Typography>
          {dept.breach > 0 && <Chip label={`${dept.breach} breach`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(184,92,82,0.15)', color: '#b85c52' }} />}
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

function ActivityItem({ item }) {
  const iconMap = { created: { icon: 'add_circle', color: '#5a8dc4' }, route: { icon: 'alt_route', color: '#7a6fa8' }, status: { icon: 'sync', color: '#c49a4a' }, comment: { icon: 'chat', color: '#7a6fa8' }, assigned: { icon: 'person_add', color: '#5a8dc4' }, resolved: { icon: 'check_circle', color: '#5a8f72' } };
  const meta = iconMap[item.kind] ?? { icon: 'info', color: '#64748b' };
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.75 }}>
      <Box sx={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, bgcolor: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: meta.color, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT, lineHeight: 1.5 }}>
          <strong>{item.who}</strong> {item.text}
        </Typography>
        <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{item.when}</Typography>
      </Box>
    </Box>
  );
}

export default function ManagerHome({ extraTickets = [] }) {
  const navigate   = useNavigate();
  const allTickets = [...extraTickets, ...tfTickets];

  const countByStatus = key => allTickets.filter(t => t.status === key).length;
  const recentTickets = [...allTickets].slice(0, 6);

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>MSS Operations</Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT }}>University-wide overview</Typography>
      </Box>

      {/* KPIs — wrap to 2 cols on mobile */}
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard label="Open"          value={countByStatus('open')}        color="#5a8dc4" icon="radio_button_unchecked" />
        <KpiCard label="In Progress"   value={countByStatus('in_progress')} color="#c49a4a" icon="pending"                />
        <KpiCard label="Resolved"      value={allTickets.filter(t => ['resolved','closed'].includes(t.status)).length} color="#5a8f72" icon="check_circle" />
        <KpiCard label="SLA Breaches"  value={allTickets.filter(t => t.status === 'in_progress').length} color="#b85c52" icon="warning" sub="Urgent + in progress" />
        <KpiCard label="Unrouted"      value={countByStatus('unrouted')}    color="#7a6fa8" icon="alt_route" sub="Pending help desk" />
      </Box>

      <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Recent tickets */}
        <Card sx={{ flex: '1 1 100%', p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Recent tickets</Typography>
            <Button size="small" onClick={() => navigate('/manager/tickets')} endIcon={<span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>} sx={{ fontSize: 11, color: ACCENT }}>View all</Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  {['ID', 'Title', 'Dept', 'Status', 'Updated'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, textTransform: 'uppercase', letterSpacing: '0.08em', pb: 1, bgcolor: PAPER2, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTickets.map(t => {
                  const s = getStatus(t.status);
                  return (
                    <TableRow key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(122,111,168,0.05)' } }}>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: ACCENT, borderColor: BORDER, whiteSpace: 'nowrap' }}>{t.id}</TableCell>
                      <TableCell sx={{ borderColor: BORDER, maxWidth: 180 }}><Typography noWrap sx={{ fontSize: 12.5, color: TEXT_BRIGHT }}>{t.title}</Typography></TableCell>
                      <TableCell sx={{ borderColor: BORDER }}><Typography sx={{ fontSize: 11, color: TEXT_DIM, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{t.dept ?? 'Unrouted'}</Typography></TableCell>
                   
                      <TableCell sx={{ borderColor: BORDER }}>
                        <Chip label={s.label} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: `${s.color}20`, color: s.color }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: TEXT_DIM, borderColor: BORDER, whiteSpace: 'nowrap' }}>{timeAgo(t.updatedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Card>

        {/* Dept load + activity side by side on large, stacked on small */}
        <Box sx={{ display: 'flex', gap: { xs: 2, md: 2 }, flexWrap: 'wrap', flex: '1 1 100%' }}>
          <Card sx={{ flex: '1 1 260px', p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Department load</Typography>
              <Button size="small" onClick={() => navigate('/manager/reports')} sx={{ fontSize: 11, color: ACCENT }}>Reports →</Button>
            </Box>
            {tfDeptLoad.map(d => <DeptBar key={d.name} dept={d} />)}
          </Card>

          <Card sx={{ flex: '1 1 260px', p: { xs: 2, md: 3 } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT, mb: 2 }}>Live activity</Typography>
            {tfActivity.map((item, i) => <ActivityItem key={i} item={item} />)}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}