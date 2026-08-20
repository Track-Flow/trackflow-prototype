import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress, Tabs, Tab,
  CircularProgress, Alert,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import api from '../helpers/api';
import {
  getSlaComplianceByDept, groupTicketsByDate, groupTicketsByAssignee, groupTicketsByDept,
} from '../helpers/ticketHelpers';
import TicketDrillDown from '../components/TicketDrillDown';

const ACCENT  = '#7a6fa8';
const TEXT_DIM   = '#94a3b8';
const TEXT_BRIGHT= '#e3e8f0';
const BORDER  = 'rgba(148,163,184,0.10)';
const PAPER   = '#111d2e';
const PAPER2  = '#0c1422';

const DEPT_COLORS = ['#5a8dc4', '#7a6fa8', '#c49a4a', '#5a8f72', '#8b5e6a', '#2ec8ff', '#ff9bd0', '#94a3b8'];
const deptColor = (i) => DEPT_COLORS[i % DEPT_COLORS.length];

function StatBox({ label, value, color, icon, sub }) {
  return (
    <Box sx={{ flex: '1 1 120px', p: { xs: 1.5, md: 2.5 }, bgcolor: PAPER2, borderRadius: 1.5, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography sx={{ fontSize: 10, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 }}>{label}</Typography>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>{icon}</span>
      </Box>
      <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, mt: 0.5 }}>{sub}</Typography>}
    </Box>
  );
}

function SectionHeader({ number, title, subtitle }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>Report {number}</Typography>
      <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700, color: TEXT_BRIGHT, mb: 0.4 }}>{title}</Typography>
      <Typography sx={{ fontSize: 12.5, color: TEXT_DIM, lineHeight: 1.6 }}>{subtitle}</Typography>
    </Box>
  );
}

function Insight({ color, icon, text }) {
  return (
    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: `${color}08`, border: `1px solid ${color}20` }}>
      <Typography sx={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.6 }}>
        <span style={{ color, fontWeight: 700 }}>{icon} Insight: </span>{text}
      </Typography>
    </Box>
  );
}

function Motivation({ text }) {
  return (
    <Box sx={{ p: 2, borderTop: `1px solid ${BORDER}`, bgcolor: PAPER2 }}>
      <Typography sx={{ fontSize: 11.5, color: TEXT_DIM, lineHeight: 1.7 }}>
        <span style={{ color: '#5a8dc4', fontWeight: 700 }}>Report motivation: </span>{text}
      </Typography>
    </Box>
  );
}

function TFTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: PAPER2, border: `1px solid ${BORDER}`, borderRadius: 1.5, p: 1.5, minWidth: 140 }}>
      <Typography sx={{ fontSize: 11, color: TEXT_DIM, mb: 0.75, fontWeight: 700 }}>{label}</Typography>
      {payload.map(p => (
        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: p.color }} />
          <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{p.name}: <strong>{p.value}</strong></Typography>
        </Box>
      ))}
    </Box>
  );
}

const AXIS_STYLE = { fill: TEXT_DIM, fontSize: 11 };
const GRID_COLOR = 'rgba(148,163,184,0.08)';

function fmtDay(iso) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

// ─── Report 1: Ticket Volume Trend ─────────────────────────────────────────────
function TicketTrendReport({ tickets, onDrillDown }) {
  const windowDays = 30;

  const trend = useMemo(() => {
    const cutoff = Date.now() - windowDays * 86400000;
    const inWindow = tickets.filter(t => new Date(t.ticket_created_at).getTime() >= cutoff);
    const openedByDate = groupTicketsByDate(inWindow, 'ticket_created_at');
    const resolvedByDate = groupTicketsByDate(
      inWindow.filter(t => t.resolved_at),
      'resolved_at'
    );

    const days = [];
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        d: fmtDay(key),
        open: (openedByDate[key] ?? []).length,
        resolved: (resolvedByDate[key] ?? []).length,
        openTickets: openedByDate[key] ?? [],
        resolvedTickets: resolvedByDate[key] ?? [],
      });
    }
    return days;
  }, [tickets]);

  const totalOpen = trend.reduce((s, d) => s + d.open, 0);
  const totalRes  = trend.reduce((s, d) => s + d.resolved, 0);
  const peak      = trend.length ? [...trend].sort((a, b) => b.open - a.open)[0] : null;

  const handleBarClick = (data) => {
    if (!data) return;
    const combined = [...data.openTickets, ...data.resolvedTickets];
    const unique = Array.from(new Map(combined.map(t => [t.ticket_id, t])).values());
    onDrillDown({ title: data.d, subtitle: `${data.open} opened · ${data.resolved} resolved`, tickets: unique });
  };

  return (
    <Box>
      <SectionHeader number="1" title="Ticket Volume Trend" subtitle="Tracks daily ticket creation vs. resolution over 2 weeks. Identifies backlog build-up and helps forecast staffing needs." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Total opened"    value={totalOpen}               color="#5a8dc4" icon="inbox"        sub={`Over ${windowDays} days`} />
        <StatBox label="Total resolved"  value={totalRes}                color="#5a8f72" icon="check_circle" sub={`Over ${windowDays} days`} />
        <StatBox label="Avg resolved/day"value={trend.length ? Math.round(totalRes/trend.length) : 0} color="#7a6fa8" icon="trending_up" />
        <StatBox label="Peak open day"   value={peak?.d ?? '—'}          color="#c49a4a" icon="warning"      sub={peak ? `${peak.open} tickets` : ''} />
      </Box>
      <Card sx={{ p: { xs: 1.5, md: 2.5 }, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 2 }}>Daily opened vs resolved · click a point's day below to drill in</Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="d" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip content={<TFTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: TEXT_DIM }} />
            <Line type="monotone" dataKey="open"     name="Opened"   stroke="#5a8dc4" strokeWidth={2} dot={{ r: 3, cursor: 'pointer' }} activeDot={{ r: 5, cursor: 'pointer', onClick: (_, i) => handleBarClick(trend[i.index]) }} />
            <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#5a8f72" strokeWidth={2} dot={{ r: 3, cursor: 'pointer' }} activeDot={{ r: 5, cursor: 'pointer', onClick: (_, i) => handleBarClick(trend[i.index]) }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow>
                {['Date', 'Opened', 'Resolved'].map(h => (
                  <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {trend.filter(d => d.open > 0 || d.resolved > 0).map(d => (
                <TableRow
                  key={d.key}
                  onClick={() => handleBarClick(d)}
                  sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(122,111,168,0.04)' } }}
                >
                  <TableCell sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT, borderColor: BORDER }}>{d.d}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#5a8dc4', borderColor: BORDER }}>{d.open}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#5a8f72', borderColor: BORDER }}>{d.resolved}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Motivation text="Enables the MSS Manager to identify backlog trends and forecast staffing needs. A persistent gap between opened and resolved signals capacity strain. Click any date row to see the individual tickets." />
      </Card>
    </Box>
  );
}

// ─── Report 2: SLA Compliance by Department ────────────────────────────────────
function SlaReport({ tickets, onDrillDown }) {
  const SLA_HOURS = 24;
  const WINDOW_DAYS = 30;
  const TARGET = 90;

  const compliance = useMemo(
    () => getSlaComplianceByDept(tickets, { windowDays: WINDOW_DAYS, slaHours: SLA_HOURS, target: TARGET }),
    [tickets]
  );

  const breaches  = compliance.filter(r => r.actual < r.target);
  const avgActual = compliance.length ? Math.round(compliance.reduce((s, r) => s + r.actual, 0) / compliance.length) : 0;

  const worst = breaches.length
    ? [...breaches].sort((a, b) => a.actual - b.actual).slice(0, 2).map(b => `${b.dept} (${b.actual}%)`).join(' and ')
    : null;

  const handleDeptClick = (row) => {
    if (!row) return;
    onDrillDown({
      title: row.dept,
      subtitle: `${row.actual}% actual vs ${row.target}% target · last ${WINDOW_DAYS} days`,
      tickets: row.tickets,
      showSla: true,
      slaHours: SLA_HOURS,
    });
  };

  return (
    <Box>
      <SectionHeader number="2" title="SLA Compliance by Department" subtitle={`Measures each department's resolution rate against a fixed ${SLA_HOURS}h SLA target, over the last ${WINDOW_DAYS} days. Drives accountability and informs renegotiation.`} />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Target"       value={`${TARGET}%`} color="#5a8dc4" icon="flag" />
        <StatBox label="Avg actual"   value={`${avgActual}%`} color={avgActual >= TARGET ? '#5a8f72' : '#b85c52'} icon="percent" />
        <StatBox label="Depts met"    value={compliance.length - breaches.length} color="#5a8f72" icon="check_circle" />
        <StatBox label="Depts breaching" value={breaches.length} color="#b85c52" icon="warning" />
      </Box>

      {compliance.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>No tickets created in the last {WINDOW_DAYS} days.</Alert>
      ) : (
        <>
          <Card sx={{ p: { xs: 1.5, md: 2.5 }, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 2 }}>Target vs actual compliance · click a bar to drill in</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compliance} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="dept" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
                <YAxis domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<TFTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: TEXT_DIM }} />
                <Bar dataKey="target" name="Target %" fill="#2a3a50" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actual" name="Actual %" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(data) => handleDeptClick(data)}>
                  {compliance.map((e, i) => <Cell key={i} fill={e.actual >= e.target ? '#5a8f72' : '#b85c52'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {worst && <Insight color="#b85c52" icon="⚠" text={`${worst} ${breaches.length > 1 ? 'are' : 'is'} below the SLA target. Consider TLA reallocation or adjusted ticket prioritisation.`} />}
          </Card>

          <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow>
                    {['Department', 'Target', 'Actual', 'Gap', 'Status', 'Tickets'].map(h => (
                      <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compliance.map(row => {
                    const met = row.actual >= row.target;
                    const gap = row.actual - row.target;
                    return (
                      <TableRow
                        key={row.dept}
                        onClick={() => handleDeptClick(row)}
                        sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(122,111,168,0.04)' } }}
                      >
                        <TableCell sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT, borderColor: BORDER, whiteSpace: 'nowrap' }}>{row.dept}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: TEXT_DIM, borderColor: BORDER }}>{row.target}%</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 700, color: met ? '#5a8f72' : '#b85c52', borderColor: BORDER }}>{row.actual}%</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: gap >= 0 ? '#5a8f72' : '#b85c52', borderColor: BORDER }}>{gap >= 0 ? `+${gap}` : gap}%</TableCell>
                        <TableCell sx={{ borderColor: BORDER }}><Chip label={met ? 'Met' : 'Breach'} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: met ? 'rgba(90,143,114,0.15)' : 'rgba(184,92,82,0.15)', color: met ? '#5a8f72' : '#b85c52' }} /></TableCell>
                        <TableCell sx={{ fontSize: 12, color: TEXT_DIM, borderColor: BORDER }}>{row.tickets.length}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Motivation text="Measures each department's resolution rate against a fixed SLA target. Drives accountability and informs SLA renegotiation with department heads. Click a row to see every ticket behind the number." />
          </Card>
        </>
      )}
    </Box>
  );
}

// ─── Report 3: TLA Workload Distribution ───────────────────────────────────────
function WorkloadReport({ tickets, onDrillDown }) {
  const workload = useMemo(() => groupTicketsByAssignee(tickets), [tickets]);

  const topTLA      = workload.length ? [...workload].sort((a, b) => b.resolved - a.resolved)[0] : null;
  const totalActive = workload.reduce((s, t) => s + t.active, 0);

  const handleTlaClick = (tla) => {
    onDrillDown({
      title: tla.name,
      subtitle: `${tla.active} active · ${tla.resolved} resolved · ${tla.dept}`,
      tickets: tla.tickets,
    });
  };

  return (
    <Box>
      <SectionHeader number="3" title="TLA Workload Distribution" subtitle="Compares active ticket load and resolved count per TLA. Identifies overloaded agents and helps balance assignments." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Total active"    value={totalActive}                          color="#5a8dc4" icon="confirmation_number" />
        <StatBox label="Top resolver"    value={topTLA ? topTLA.name.split(' ')[0] : '—'} color="#7a6fa8" icon="emoji_events" sub={topTLA ? `${topTLA.resolved} resolved` : ''} />
        <StatBox label="TLAs monitored"  value={workload.length}                      color="#c49a4a" icon="badge" />
      </Box>

      {workload.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>No tickets currently assigned to a TLA.</Alert>
      ) : (
        <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden', mb: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  {['TLA', 'Dept', 'Active', 'Resolved', 'Load'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {workload.map(tla => {
                  const loadPct   = Math.min(Math.round((tla.active / 6) * 100), 100);
                  const loadColor = loadPct > 75 ? '#b85c52' : loadPct > 50 ? '#c49a4a' : '#5a8f72';
                  return (
                    <TableRow
                      key={tla.id}
                      onClick={() => handleTlaClick(tla)}
                      sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(122,111,168,0.04)' } }}
                    >
                      <TableCell sx={{ borderColor: BORDER, whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: `${ACCENT}20`, color: ACCENT }}>
                            {tla.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>{tla.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 11.5, color: TEXT_DIM, borderColor: BORDER, whiteSpace: 'nowrap' }}>{tla.dept.split(' ')[0]}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#5a8dc4', borderColor: BORDER }}>{tla.active}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#5a8f72', borderColor: BORDER }}>{tla.resolved}</TableCell>
                      <TableCell sx={{ borderColor: BORDER, minWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                            <Box sx={{ width: `${loadPct}%`, height: '100%', bgcolor: loadColor, borderRadius: 3 }} />
                          </Box>
                          <Typography sx={{ fontSize: 10.5, color: loadColor, minWidth: 28, fontWeight: 700 }}>{loadPct}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          <Motivation text="Provides the MSS Manager with visibility into individual TLA workload, enabling recognition of high performers and data-driven workload balancing. Click a TLA to see their active and resolved tickets." />
        </Card>
      )}
    </Box>
  );
}

// ─── Report 4: Department Volume Breakdown ─────────────────────────────────────
function DeptVolumeReport({ tickets, onDrillDown }) {
  const deptLoad = useMemo(
    () => groupTicketsByDept(tickets).map((d, i) => ({ ...d, color: deptColor(i) })),
    [tickets]
  );

  const allTotal    = deptLoad.reduce((s, d) => s + d.open + d.resolved, 0);
  const allOpen     = deptLoad.reduce((s, d) => s + d.open, 0);
  const allResolved = deptLoad.reduce((s, d) => s + d.resolved, 0);
  const topDept     = deptLoad.length ? [...deptLoad].sort((a, b) => (b.open + b.resolved) - (a.open + a.resolved))[0] : null;
  const pieData      = deptLoad.map(d => ({ name: d.name, value: d.open + d.resolved, color: d.color }));

  const handleDeptClick = (dept) => {
    if (!dept) return;
    onDrillDown({
      title: dept.name,
      subtitle: `${dept.open} open · ${dept.resolved} resolved`,
      tickets: dept.tickets,
    });
  };

  const handlePieClick = (data) => {
    const match = deptLoad.find(d => d.name === data?.name);
    handleDeptClick(match);
  };

  return (
    <Box>
      <SectionHeader number="4" title="Department Volume Breakdown" subtitle="Shows total ticket volume share per department. Supports resource allocation and identifies which departments generate the most demand." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Total tickets"  value={allTotal}    color="#5a8dc4" icon="confirmation_number" />
        <StatBox label="Total open"     value={allOpen}     color="#c49a4a" icon="inbox" sub="Needs attention" />
        <StatBox label="Total resolved" value={allResolved} color="#5a8f72" icon="check_circle" sub={allTotal ? `${Math.round((allResolved/allTotal)*100)}% rate` : ''} />
        <StatBox label="Highest volume" value={topDept ? topDept.name.split(' ')[0] : '—'} color="#7a6fa8" icon="leaderboard" sub={topDept ? `${topDept.open + topDept.resolved} tickets` : ''} />
      </Box>

      {deptLoad.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>No tickets found.</Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Card sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: PAPER, border: `1px solid ${BORDER}`, flex: '0 0 auto', width: { xs: '100%', sm: 240 } }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 1.5 }}>Volume share · click a slice</Typography>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" cursor="pointer" onClick={handlePieClick}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<TFTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {deptLoad.map(d => {
                const total = d.open + d.resolved;
                const pct   = allTotal > 0 ? Math.round((total / allTotal) * 100) : 0;
                return (
                  <Box
                    key={d.name}
                    onClick={() => handleDeptClick(d)}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6, cursor: 'pointer', borderRadius: 1, px: 0.5, '&:hover': { bgcolor: 'rgba(122,111,168,0.06)' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: d.color }} />
                      <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>{d.name.split(' ')[0]}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_BRIGHT }}>{pct}%</Typography>
                  </Box>
                );
              })}
            </Card>

            <Card sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: PAPER, border: `1px solid ${BORDER}`, flex: '1 1 200px' }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 2 }}>Open vs resolved by department · click a bar</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptLoad} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip content={<TFTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: TEXT_DIM }} />
                  <Bar dataKey="open"     name="Open"     fill="#c49a4a" radius={[3, 3, 0, 0]} cursor="pointer" onClick={handleDeptClick} />
                  <Bar dataKey="resolved" name="Resolved" fill="#5a8f72" radius={[3, 3, 0, 0]} cursor="pointer" onClick={handleDeptClick} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Box>

          <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
              {deptLoad.map(d => {
                const total = d.open + d.resolved;
                const pct   = allTotal > 0 ? Math.round((total / allTotal) * 100) : 0;
                return (
                  <Box
                    key={d.name}
                    onClick={() => handleDeptClick(d)}
                    sx={{ mb: 2, cursor: 'pointer', borderRadius: 1, p: 0.5, '&:hover': { bgcolor: 'rgba(122,111,168,0.04)' } }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6, flexWrap: 'wrap', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: d.color }} />
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>{d.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Typography sx={{ fontSize: 11.5, color: '#c49a4a' }}>{d.open} open</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#5a8f72' }}>{d.resolved} resolved</Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(148,163,184,0.1)', '& .MuiLinearProgress-bar': { bgcolor: d.color, borderRadius: 3 } }} />
                  </Box>
                );
              })}
              {topDept && (
                <Insight color="#5a8dc4" icon="📊" text={`${topDept.name} generates the highest ticket volume. Consider whether current TLA headcount is sufficient or whether student self-service docs could reduce repeat tickets.`} />
              )}
            </Box>
            <Motivation text="Shows total ticket volume share per department to support resource allocation and identify which departments generate the most demand. Click any department to see its ticket list." />
          </Card>
        </>
      )}
    </Box>
  );
}

// ─── Page shell ─────────────────────────────────────────────────────────────────
export default function ManagerReports() {
  const [tab, setTab] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState(null); // { title, subtitle, tickets, showSla?, slaHours? } | null

  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    api.get('/tickets')
      .then(res => setTickets(res.data))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>MSS Manager</Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT }}>Reports &amp; Analytics</Typography>
        <Typography sx={{ fontSize: 12.5, color: TEXT_DIM, mt: 0.5 }}>Generated {generated} · Live data</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3, borderBottom: `1px solid ${BORDER}`,
          '& .MuiTabs-indicator': { bgcolor: ACCENT },
          '& .MuiTab-root': { color: TEXT_DIM, fontSize: 12.5, fontWeight: 600, textTransform: 'none', minWidth: 0, mr: 0.5, px: { xs: 1.5, md: 2 } },
          '& .Mui-selected': { color: TEXT_BRIGHT },
        }}
      >
        <Tab label="📈 Trend" />
        <Tab label="🎯 SLA" />
        <Tab label="👤 TLAs" />
        <Tab label="🏢 Volume" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: ACCENT }} />
        </Box>
      ) : (
        <>
          {tab === 0 && <TicketTrendReport tickets={tickets} onDrillDown={setDrilldown} />}
          {tab === 1 && <SlaReport tickets={tickets} onDrillDown={setDrilldown} />}
          {tab === 2 && <WorkloadReport tickets={tickets} onDrillDown={setDrilldown} />}
          {tab === 3 && <DeptVolumeReport tickets={tickets} onDrillDown={setDrilldown} />}
        </>
      )}

      <TicketDrillDown
        open={!!drilldown}
        onClose={() => setDrilldown(null)}
        title={drilldown?.title}
        subtitle={drilldown?.subtitle}
        tickets={drilldown?.tickets ?? []}
        showSla={drilldown?.showSla ?? false}
        slaHours={drilldown?.slaHours ?? 24}
      />
    </Box>
  );
}