import { useState } from 'react';
import {
  Box, Typography, Card, Chip, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress, Tabs, Tab,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { tfTrend, tfSlaCompliance, tfTlaWorkload, tfDeptLoad } from '../data/mockData';

const ACCENT  = '#7a6fa8';
const TEXT_DIM   = '#94a3b8';
const TEXT_BRIGHT= '#e3e8f0';
const BORDER  = 'rgba(148,163,184,0.10)';
const PAPER   = '#111d2e';
const PAPER2  = '#0c1422';

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

function TicketTrendReport() {
  const totalOpen = tfTrend.reduce((s, d) => s + d.open, 0);
  const totalRes  = tfTrend.reduce((s, d) => s + d.resolved, 0);
  const peak      = [...tfTrend].sort((a, b) => b.open - a.open)[0];

  return (
    <Box>
      <SectionHeader number="1" title="Ticket Volume Trend" subtitle="Tracks daily ticket creation vs. resolution over 2 weeks. Identifies backlog build-up and helps forecast staffing needs." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Total opened"    value={totalOpen}               color="#5a8dc4" icon="inbox"        sub="Over 14 days" />
        <StatBox label="Total resolved"  value={totalRes}                color="#5a8f72" icon="check_circle" sub="Over 14 days" />
        <StatBox label="Avg resolved/day"value={Math.round(totalRes/tfTrend.length)} color="#7a6fa8" icon="trending_up" />
        <StatBox label="Peak open day"   value={peak.d}                  color="#c49a4a" icon="warning"      sub={`${peak.open} tickets`} />
      </Box>
      <Card sx={{ p: { xs: 1.5, md: 2.5 }, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 2 }}>Daily opened vs resolved</Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={tfTrend} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="d" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip content={<TFTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: TEXT_DIM }} />
            <Line type="monotone" dataKey="open"     name="Opened"   stroke="#5a8dc4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#5a8f72" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <Insight color="#5a8dc4" icon="📊" text="Apr 14–19 shows a spike in open tickets without a matching resolution increase — review IT Support capacity for this period." />
      </Card>
      <Box sx={{ borderRadius: 1.5, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Motivation text="Enables the MSS Manager to identify backlog trends and forecast staffing needs. A persistent gap between opened and resolved signals capacity strain." />
      </Box>
    </Box>
  );
}

function SlaReport() {
  const breaches  = tfSlaCompliance.filter(r => r.actual < r.target);
  const avgActual = Math.round(tfSlaCompliance.reduce((s, r) => s + r.actual, 0) / tfSlaCompliance.length);
  const avgTarget = Math.round(tfSlaCompliance.reduce((s, r) => s + r.target, 0) / tfSlaCompliance.length);

  return (
    <Box>
      <SectionHeader number="2" title="SLA Compliance by Department" subtitle="Measures each department's resolution rate against their agreed SLA target. Drives accountability and informs renegotiation." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Avg target"   value={`${avgTarget}%`} color="#5a8dc4" icon="flag" />
        <StatBox label="Avg actual"   value={`${avgActual}%`} color={avgActual >= avgTarget ? '#5a8f72' : '#b85c52'} icon="percent" />
        <StatBox label="SLA met"      value={tfSlaCompliance.length - breaches.length} color="#5a8f72" icon="check_circle" />
        <StatBox label="Breaches"     value={breaches.length} color="#b85c52" icon="warning" />
      </Box>
      <Card sx={{ p: { xs: 1.5, md: 2.5 }, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 2 }}>Target vs actual compliance</Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tfSlaCompliance} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="dept" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[70, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<TFTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: TEXT_DIM }} />
            <Bar dataKey="target" name="Target %" fill="#2a3a50" radius={[3, 3, 0, 0]} />
            <Bar dataKey="actual" name="Actual %" radius={[3, 3, 0, 0]}>
              {tfSlaCompliance.map((e, i) => <Cell key={i} fill={e.actual >= e.target ? '#5a8f72' : '#b85c52'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Insight color="#b85c52" icon="⚠" text="IT Support (87%) and Library Services (82%) are below their SLA targets. Consider TLA reallocation or adjusted ticket prioritisation." />
      </Card>
      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow>
                {['Department', 'Target', 'Actual', 'Gap', 'Status'].map(h => (
                  <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tfSlaCompliance.map(row => {
                const met = row.actual >= row.target;
                const gap = row.actual - row.target;
                return (
                  <TableRow key={row.dept}>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT, borderColor: BORDER, whiteSpace: 'nowrap' }}>{row.dept}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: TEXT_DIM, borderColor: BORDER }}>{row.target}%</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 700, color: met ? '#5a8f72' : '#b85c52', borderColor: BORDER }}>{row.actual}%</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 700, color: gap >= 0 ? '#5a8f72' : '#b85c52', borderColor: BORDER }}>{gap >= 0 ? `+${gap}` : gap}%</TableCell>
                    <TableCell sx={{ borderColor: BORDER }}><Chip label={met ? 'Met' : 'Breach'} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: met ? 'rgba(90,143,114,0.15)' : 'rgba(184,92,82,0.15)', color: met ? '#5a8f72' : '#b85c52' }} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        <Motivation text="Measures each department's resolution rate against their agreed SLA target. Drives accountability and informs SLA renegotiation with department heads." />
      </Card>
    </Box>
  );
}

function WorkloadReport() {
  const topTLA     = [...tfTlaWorkload].sort((a, b) => b.resolvedWk - a.resolvedWk)[0];
  const avgSla     = Math.round(tfTlaWorkload.reduce((s, t) => s + t.sla, 0) / tfTlaWorkload.length);
  const totalActive= tfTlaWorkload.reduce((s, t) => s + t.active, 0);

  return (
    <Box>
      <SectionHeader number="3" title="TLA Workload Distribution" subtitle="Compares active ticket load and weekly resolution rate per TLA. Identifies overloaded agents and helps balance assignments." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Total active"    value={totalActive}                    color="#5a8dc4" icon="confirmation_number" />
        <StatBox label="Team avg SLA"    value={`${avgSla}%`}                   color={avgSla >= 90 ? '#5a8f72' : '#c49a4a'} icon="percent" />
        <StatBox label="Top resolver"    value={topTLA.name.split(' ')[0]}      color="#7a6fa8" icon="emoji_events" sub={`${topTLA.resolvedWk} resolved`} />
        <StatBox label="TLAs monitored"  value={tfTlaWorkload.length}           color="#c49a4a" icon="badge" />
      </Box>
      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                {['TLA', 'Dept', 'Active', 'Resolved wk', 'SLA', 'Load'].map(h => (
                  <TableCell key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tfTlaWorkload.map(tla => {
                const loadPct   = Math.min(Math.round((tla.active / 6) * 100), 100);
                const loadColor = loadPct > 75 ? '#b85c52' : loadPct > 50 ? '#c49a4a' : '#5a8f72';
                const slaColor  = tla.sla >= 90 ? '#5a8f72' : tla.sla >= 80 ? '#c49a4a' : '#b85c52';
                return (
                  <TableRow key={tla.name} sx={{ '&:hover td': { bgcolor: 'rgba(122,111,168,0.04)' } }}>
                    <TableCell sx={{ borderColor: BORDER, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: `${slaColor}20`, color: slaColor }}>
                          {tla.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </Avatar>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>{tla.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11.5, color: TEXT_DIM, borderColor: BORDER, whiteSpace: 'nowrap' }}>{tla.dept.split(' ')[0]}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#5a8dc4', borderColor: BORDER }}>{tla.active}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#5a8f72', borderColor: BORDER }}>{tla.resolvedWk}</TableCell>
                    <TableCell sx={{ borderColor: BORDER }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: slaColor }}>{tla.sla}%</Typography>
                    </TableCell>
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
        <Box sx={{ p: 2, borderTop: `1px solid ${BORDER}` }}>
          <Insight color="#c49a4a" icon="📊" text="Marco Rossi has the lowest SLA rate (79%) with a moderate active load — consider a coaching session or partial ticket reassignment." />
        </Box>
        <Motivation text="Provides the MSS Manager with visibility into individual TLA workload and performance, enabling recognition of high performers and data-driven workload balancing." />
      </Card>
    </Box>
  );
}

function DeptVolumeReport() {
  const allTotal   = tfDeptLoad.reduce((s, d) => s + d.open + d.resolved, 0);
  const allOpen    = tfDeptLoad.reduce((s, d) => s + d.open, 0);
  const allResolved= tfDeptLoad.reduce((s, d) => s + d.resolved, 0);
  const topDept    = [...tfDeptLoad].sort((a, b) => (b.open + b.resolved) - (a.open + a.resolved))[0];
  const pieData    = tfDeptLoad.map(d => ({ name: d.name, value: d.open + d.resolved, color: d.color }));

  return (
    <Box>
      <SectionHeader number="4" title="Department Volume Breakdown" subtitle="Shows total ticket volume share per department. Supports resource allocation and identifies which departments generate the most demand." />
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, mb: 2.5, flexWrap: 'wrap' }}>
        <StatBox label="Total tickets"  value={allTotal}    color="#5a8dc4" icon="confirmation_number" />
        <StatBox label="Total open"     value={allOpen}     color="#c49a4a" icon="inbox" sub="Needs attention" />
        <StatBox label="Total resolved" value={allResolved} color="#5a8f72" icon="check_circle" sub={`${Math.round((allResolved/allTotal)*100)}% rate`} />
        <StatBox label="Highest volume" value={topDept.name.split(' ')[0]} color="#7a6fa8" icon="leaderboard" sub={`${topDept.open + topDept.resolved} tickets`} />
      </Box>

      {/* Pie + bars */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Card sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: PAPER, border: `1px solid ${BORDER}`, flex: '0 0 auto', width: { xs: '100%', sm: 240 } }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 1.5 }}>Volume share</Typography>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<TFTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {tfDeptLoad.map(d => {
            const total = d.open + d.resolved;
            const pct   = allTotal > 0 ? Math.round((total / allTotal) * 100) : 0;
            return (
              <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
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
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.09em', mb: 2 }}>Open vs resolved by department</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tfDeptLoad} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <Tooltip content={<TFTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: TEXT_DIM }} />
              <Bar dataKey="open"     name="Open"     fill="#c49a4a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#5a8f72" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Box>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          {tfDeptLoad.map(d => {
            const total = d.open + d.resolved;
            const pct   = allTotal > 0 ? Math.round((total / allTotal) * 100) : 0;
            return (
              <Box key={d.name} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6, flexWrap: 'wrap', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: d.color }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>{d.name}</Typography>
                    {d.breach > 0 && <Chip label={`${d.breach} breach`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(184,92,82,0.15)', color: '#b85c52' }} />}
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
          <Insight color="#5a8dc4" icon="📊" text="IT Support generates the highest ticket volume. Consider whether current TLA headcount is sufficient or whether student self-service docs could reduce repeat tickets." />
        </Box>
        <Motivation text="Shows total ticket volume share per department to support resource allocation and identify which departments generate the most demand. Used in monthly reporting to MSS leadership." />
      </Card>
    </Box>
  );
}

export default function ManagerReports() {
  const [tab, setTab] = useState(0);
  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>MSS Manager</Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT }}>Reports &amp; Analytics</Typography>
        <Typography sx={{ fontSize: 12.5, color: TEXT_DIM, mt: 0.5 }}>Generated {generated} · Prototype seed data</Typography>
      </Box>

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

      {tab === 0 && <TicketTrendReport />}
      {tab === 1 && <SlaReport />}
      {tab === 2 && <WorkloadReport />}
      {tab === 3 && <DeptVolumeReport />}
    </Box>
  );
}