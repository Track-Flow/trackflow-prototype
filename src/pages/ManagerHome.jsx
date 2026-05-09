import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress,
} from '@mui/material';
import {
  tfTickets, tfUsers, tfDeptLoad, tfActivity,
  getStatus, timeAgo, getUser,
} from '../data/mockData';

const ACCENT     = '#ff9bd0';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';

function KpiCard({ label, value, color, sub, icon }) {
  return (
    <Card sx={{ flex: '1 1 150px', p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: `${color}99` }}>{icon}</span>
      </Box>
      <Typography sx={{ fontSize: 32, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: TEXT_DIM, mt: 0.5 }}>{sub}</Typography>}
    </Card>
  );
}

function DeptBar({ dept }) {
  const total   = dept.open + dept.resolved;
  const pct     = total > 0 ? Math.round((dept.resolved / total) * 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dept.color }} />
          <Typography sx={{ fontSize: 12.5, color: TEXT_BRIGHT, fontWeight: 600 }}>{dept.name}</Typography>
          {dept.breach > 0 && (
            <Chip label={`${dept.breach} breach`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: 11, color: '#ffb547' }}>{dept.open} open</Typography>
          <Typography sx={{ fontSize: 11, color: '#2bd48f' }}>{dept.resolved} resolved</Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: 'rgba(143,162,192,0.1)',
          '& .MuiLinearProgress-bar': { bgcolor: dept.color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

function ActivityItem({ item }) {
  const iconMap = {
    created:  { icon: 'add_circle',   color: '#2ec8ff' },
    route:    { icon: 'alt_route',    color: '#ff9bd0' },
    status:   { icon: 'sync',         color: '#ffb547' },
    comment:  { icon: 'chat',         color: '#c084fc' },
    assigned: { icon: 'person_add',   color: '#6fdcff' },
    resolved: { icon: 'check_circle', color: '#2bd48f' },
  };
  const meta = iconMap[item.kind] ?? { icon: 'info', color: '#8fa2c0' };
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

  const countByStatus = (key) => allTickets.filter(t => t.status === key).length;
  const slaBreaches   = allTickets.filter(t => t.status === 'in_progress').length;
  const resolvedToday = allTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;

  // Recent tickets for the table (last 6)
  const recentTickets = [...allTickets].slice(0, 6);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Operations
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>University-wide overview</Typography>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard label="Open"           value={countByStatus('open')}        color="#2ec8ff" icon="radio_button_unchecked" />
        <KpiCard label="In Progress"    value={countByStatus('in_progress')} color="#ffb547" icon="pending"                />
        <KpiCard label="Resolved today" value={resolvedToday}                color="#2bd48f" icon="check_circle"           />
        <KpiCard label="SLA breaches"   value={slaBreaches}                  color="#ff6b6b" icon="warning"
          sub={slaBreaches > 0 ? 'Needs attention' : 'All clear'} />
        <KpiCard label="Unrouted"       value={countByStatus('unrouted')}    color="#ff9bd0" icon="alt_route"
          sub="Pending help desk" />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Recent tickets table */}
        <Card sx={{ flex: '1 1 500px', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Recent tickets</Typography>
            <Button size="small" onClick={() => navigate('/manager/tickets')}
              endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>}
              sx={{ fontSize: 11, color: ACCENT }}>
              View all
            </Button>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                {['ID', 'Title', 'Dept',  'Status', 'Updated'].map(h => (
                  <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, textTransform: 'uppercase', letterSpacing: '0.08em', pb: 1 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTickets.map(t => {
                const s = getStatus(t.status);
                return (
                  <TableRow
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(255,155,208,0.04)' } }}
                  >
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2', borderColor: BORDER }}>{t.id}</TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: TEXT_BRIGHT, borderColor: BORDER, maxWidth: 200 }}>
                      <Typography noWrap sx={{ fontSize: 12.5, color: TEXT_BRIGHT }}>{t.title}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: BORDER }}>
                      <Typography sx={{ fontSize: 11, color: TEXT_DIM, textTransform: 'capitalize' }}>{t.dept ?? 'Unrouted'}</Typography>
                    </TableCell>
                    
                    <TableCell sx={{ borderColor: BORDER }}>
                      <Chip label={s.label} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: `${s.color}20`, color: s.color }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, color: TEXT_DIM, borderColor: BORDER }}>{timeAgo(t.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Right column */}
        <Box sx={{ flex: '0 1 300px', display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Department load */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Department load</Typography>
              <Button size="small" onClick={() => navigate('/manager/reports')}
                sx={{ fontSize: 11, color: ACCENT }}>Reports →</Button>
            </Box>
            {tfDeptLoad.map(d => <DeptBar key={d.name} dept={d} />)}
          </Card>

          {/* Live activity */}
          <Card sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT, mb: 2 }}>Live activity</Typography>
            {tfActivity.map((item, i) => <ActivityItem key={i} item={item} />)}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}