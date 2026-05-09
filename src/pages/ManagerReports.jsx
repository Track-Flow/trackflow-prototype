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

const ACCENT  = '#ff9bd0';
const PAPER   = '#0f1f3a';
const PAPER2  = '#080f1e';
const BORDER  = 'rgba(143,162,192,0.12)';

// ─── Stat box (from real system style) ───────────────────────────────────────

function StatBox({ label, value, color, icon, sub }) {
  return (
    <Box sx={{
      flex: 1, p: 2.5, bgcolor: PAPER2, borderRadius: 2,
      border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: 11, color: '#5b6d8a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
          {label}
        </Typography>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
      </Box>
      <Typography sx={{ fontSize: 30, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif', lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: '#5b6d8a', mt: 0.75 }}>{sub}</Typography>}
    </Box>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ number, title, subtitle }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
        Report {number}
      </Typography>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#e6edf7', fontFamily: '"Rubik", sans-serif', mb: 0.4 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#8fa2c0', lineHeight: 1.6, maxWidth: 620 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

// ─── Insight callout ──────────────────────────────────────────────────────────

function Insight({ color, icon, text }) {
  return (
    <Box sx={{ mt: 2, p: 1.75, borderRadius: 2, bgcolor: `${color}08`, border: `1px solid ${color}20` }}>
      <Typography sx={{ fontSize: 12.5, color: '#8fa2c0', lineHeight: 1.6 }}>
        <span style={{ color, fontWeight: 700 }}>{icon} Insight: </span>
        {text}
      </Typography>
    </Box>
  );
}

// ─── Motivation box ───────────────────────────────────────────────────────────

function Motivation({ text }) {
  return (
    <Box sx={{ p: 2, borderTop: `1px solid ${BORDER}`, bgcolor: PAPER2 }}>
      <Typography sx={{ fontSize: 11.5, color: '#5b6d8a', lineHeight: 1.7 }}>
        <span style={{ color: '#2ec8ff', fontWeight: 700 }}>Report motivation: </span>
        {text}
      </Typography>
    </Box>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function TFTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: '#0d1e38', border: `1px solid ${BORDER}`, borderRadius: 2, p: 1.5, minWidth: 150 }}>
      <Typography sx={{ fontSize: 11, color: '#8fa2c0', mb: 0.75, fontWeight: 700 }}>{label}</Typography>
      {payload.map(p => (
        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography sx={{ fontSize: 12, color: '#c8d8ee' }}>{p.name}: <strong>{p.value}</strong></Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── Report 1: Ticket Volume Trend ───────────────────────────────────────────

function TicketTrendReport() {
  const totalOpen     = tfTrend.reduce((s, d) => s + d.open, 0);
  const totalResolved = tfTrend.reduce((s, d) => s + d.resolved, 0);
  const peakDay       = [...tfTrend].sort((a, b) => b.open - a.open)[0];
  const avgResolved   = Math.round(totalResolved / tfTrend.length);

  return (
    <Box>
      <SectionHeader
        number="1"
        title="Ticket Volume Trend"
        subtitle="Tracks daily ticket creation vs. resolution over a 2-week period. Identifies backlog build-up and helps managers forecast staffing needs."
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <StatBox label="Total opened"   value={totalOpen}     color="#2ec8ff" icon="inbox"         sub="Over 14 days" />
        <StatBox label="Total resolved" value={totalResolved} color="#2bd48f" icon="check_circle"  sub="Over 14 days" />
        <StatBox label="Avg resolved/day" value={avgResolved} color="#c084fc" icon="trending_up"   sub="Daily average" />
        <StatBox label="Peak open day"  value={peakDay.d}     color="#ffb547" icon="warning"       sub={`${peakDay.open} tickets opened`} />
      </Box>

      <Card sx={{ p: 2.5, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8fa2c0', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
          Daily opened vs resolved
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={tfTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(143,162,192,0.08)" />
            <XAxis dataKey="d" tick={{ fill: '#5b6d8a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5b6d8a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<TFTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8fa2c0', paddingTop: 8 }} />
            <Line type="monotone" dataKey="open"     name="Opened"   stroke="#2ec8ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#2bd48f" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>

        <Insight
          color="#2ec8ff"
          icon="📊"
          text="Apr 14–19 shows a spike in open tickets without a matching resolution increase — review IT Support capacity for this period. A persistent gap between opened and resolved lines indicates backlog growth requiring TLA reallocation."
        />
      </Card>

      <Box sx={{ borderRadius: 2, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Motivation text="This report enables the MSS Manager to identify backlog build-up trends and forecast staffing needs. A persistent gap between opened and resolved tickets signals capacity strain, prompting timely TLA reallocation before SLA targets are breached." />
      </Box>
    </Box>
  );
}

// ─── Report 2: SLA Compliance ─────────────────────────────────────────────────

function SlaReport() {
  const breaches  = tfSlaCompliance.filter(r => r.actual < r.target);
  const avgActual = Math.round(tfSlaCompliance.reduce((s, r) => s + r.actual, 0) / tfSlaCompliance.length);
  const avgTarget = Math.round(tfSlaCompliance.reduce((s, r) => s + r.target, 0) / tfSlaCompliance.length);

  return (
    <Box>
      <SectionHeader
        number="2"
        title="SLA Compliance by Department"
        subtitle="Measures each department's resolution rate against their agreed SLA target. Departments below target are highlighted. Drives accountability and informs SLA renegotiation."
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <StatBox label="Avg target"     value={`${avgTarget}%`}    color="#2ec8ff" icon="flag"          sub="Across departments" />
        <StatBox label="Avg actual"     value={`${avgActual}%`}    color={avgActual >= avgTarget ? '#2bd48f' : '#ff6b6b'} icon="percent" sub="Current performance" />
        <StatBox label="SLA met"        value={tfSlaCompliance.length - breaches.length} color="#2bd48f" icon="check_circle" sub="Departments on target" />
        <StatBox label="SLA breaches"   value={breaches.length}    color="#ff6b6b" icon="warning"       sub={breaches.length > 0 ? breaches.map(b => b.dept).join(', ') : 'All clear'} />
      </Box>

      <Card sx={{ p: 2.5, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8fa2c0', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
          Target vs actual compliance
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={tfSlaCompliance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(143,162,192,0.08)" />
            <XAxis dataKey="dept" tick={{ fill: '#5b6d8a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[70, 100]} tick={{ fill: '#5b6d8a', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<TFTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8fa2c0', paddingTop: 8 }} />
            <Bar dataKey="target" name="Target %" fill="#3a4f6a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual %" radius={[4, 4, 0, 0]}>
              {tfSlaCompliance.map((entry, i) => (
                <Cell key={i} fill={entry.actual >= entry.target ? '#2bd48f' : '#ff6b6b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <Insight
          color="#ff6b6b"
          icon="⚠"
          text="IT Support (87%) and Library Services (82%) are below their respective SLA targets. Consider TLA reallocation or adjusted ticket prioritisation for these departments in the next sprint."
        />
      </Card>

      {/* SLA table */}
      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8fa2c0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Department SLA breakdown
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Department', 'Target', 'Actual', 'Gap', 'Status'].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#5b6d8a', borderBottom: `1px solid ${BORDER}`, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tfSlaCompliance.map(row => {
              const met = row.actual >= row.target;
              const gap = row.actual - row.target;
              return (
                <TableRow key={row.dept} sx={{ '&:hover': { bgcolor: 'rgba(255,155,208,0.03)' } }}>
                  <TableCell sx={{ fontSize: 13, fontWeight: 600, color: '#e6edf7', borderBottom: `1px solid ${BORDER}` }}>{row.dept}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#8fa2c0', borderBottom: `1px solid ${BORDER}` }}>{row.target}%</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700, color: met ? '#2bd48f' : '#ff6b6b', borderBottom: `1px solid ${BORDER}` }}>{row.actual}%</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 700, color: gap >= 0 ? '#2bd48f' : '#ff6b6b', borderBottom: `1px solid ${BORDER}` }}>
                    {gap >= 0 ? `+${gap}` : gap}%
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Chip label={met ? 'Met' : 'Breach'} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: met ? 'rgba(43,212,143,0.15)' : 'rgba(255,107,107,0.15)', color: met ? '#2bd48f' : '#ff6b6b' }} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Motivation text="This report measures each department's resolution rate against their agreed SLA target. Departments below target are flagged for review. Drives accountability across department heads and informs SLA renegotiation discussions with MSS leadership on a monthly basis." />
      </Card>
    </Box>
  );
}

// ─── Report 3: TLA Workload Distribution ─────────────────────────────────────

function WorkloadReport() {
  const topTLA     = [...tfTlaWorkload].sort((a, b) => b.resolvedWk - a.resolvedWk)[0];
  const avgSla     = Math.round(tfTlaWorkload.reduce((s, t) => s + t.sla, 0) / tfTlaWorkload.length);
  const totalActive= tfTlaWorkload.reduce((s, t) => s + t.active, 0);

  return (
    <Box>
      <SectionHeader
        number="3"
        title="TLA Workload Distribution"
        subtitle="Compares active ticket load and weekly resolution rate per TLA. Identifies overloaded agents and under-utilised capacity. Helps managers balance assignments and recognise high performers."
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <StatBox label="Total active"   value={totalActive}          color="#2ec8ff" icon="confirmation_number" sub="Across all TLAs" />
        <StatBox label="Team avg SLA"   value={`${avgSla}%`}         color={avgSla >= 90 ? '#2bd48f' : '#ffb547'} icon="percent" sub="SLA compliance" />
        <StatBox label="Top resolver"   value={topTLA.name.split(' ')[0]} color="#c084fc" icon="emoji_events" sub={`${topTLA.resolvedWk} resolved this week`} />
        <StatBox label="TLAs monitored" value={tfTlaWorkload.length} color="#ff9bd0" icon="badge" sub="Active team members" />
      </Box>

      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8fa2c0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Per-TLA breakdown
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['TLA', 'Department', 'Active', 'Resolved this week', 'SLA rate', 'Load'].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#5b6d8a', borderBottom: `1px solid ${BORDER}`, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tfTlaWorkload.map(tla => {
              const loadPct   = Math.min(Math.round((tla.active / 6) * 100), 100);
              const loadColor = loadPct > 75 ? '#ff6b6b' : loadPct > 50 ? '#ffb547' : '#2bd48f';
              const slaColor  = tla.sla >= 90 ? '#2bd48f' : tla.sla >= 80 ? '#ffb547' : '#ff6b6b';
              const initials  = tla.name.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <TableRow key={tla.name} sx={{ '&:hover': { bgcolor: 'rgba(255,155,208,0.03)' } }}>
                  <TableCell sx={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 10, fontWeight: 700, bgcolor: `${slaColor}20`, color: slaColor }}>
                        {initials}
                      </Avatar>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#e6edf7' }}>{tla.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#8fa2c0', borderBottom: `1px solid ${BORDER}` }}>{tla.dept}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#2ec8ff', borderBottom: `1px solid ${BORDER}` }}>{tla.active}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#2bd48f', borderBottom: `1px solid ${BORDER}` }}>{tla.resolvedWk}</TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: slaColor }}>{tla.sla}%</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${BORDER}`, minWidth: 130 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(143,162,192,0.1)', overflow: 'hidden' }}>
                        <Box sx={{ width: `${loadPct}%`, height: '100%', bgcolor: loadColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </Box>
                      <Typography sx={{ fontSize: 10.5, color: loadColor, minWidth: 30, fontWeight: 700 }}>{loadPct}%</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Box sx={{ p: 2, borderTop: `1px solid ${BORDER}`, bgcolor: PAPER2 }}>
          <Insight
            color="#ffb547"
            icon="📊"
            text="Marco Rossi has the lowest SLA rate (79%) with a moderate active load — consider a coaching session or partial ticket reassignment to Nadia Fisher who has capacity."
          />
        </Box>

        <Motivation text="This report provides the MSS Manager with visibility into individual TLA workload and performance, enabling recognition of high performers, early identification of TLAs who may need additional support or training, and data-driven decisions around ticket assignment and workload balancing." />
      </Card>
    </Box>
  );
}

// ─── Report 4: Department Volume Breakdown ────────────────────────────────────

function DeptVolumeReport() {
  const allTotal  = tfDeptLoad.reduce((s, d) => s + d.open + d.resolved, 0);
  const allOpen   = tfDeptLoad.reduce((s, d) => s + d.open, 0);
  const allResolved = tfDeptLoad.reduce((s, d) => s + d.resolved, 0);
  const topDept   = [...tfDeptLoad].sort((a, b) => (b.open + b.resolved) - (a.open + a.resolved))[0];

  const pieData = tfDeptLoad.map(d => ({ name: d.name, value: d.open + d.resolved, color: d.color }));

  return (
    <Box>
      <SectionHeader
        number="4"
        title="Department Volume Breakdown"
        subtitle="Shows total ticket volume share per department. Supports resource allocation decisions and identifies which departments generate the most support demand. Used in monthly reporting to MSS leadership."
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <StatBox label="Total tickets"   value={allTotal}    color="#2ec8ff" icon="confirmation_number" sub="All departments" />
        <StatBox label="Total open"      value={allOpen}     color="#ffb547" icon="inbox"               sub="Needs attention" />
        <StatBox label="Total resolved"  value={allResolved} color="#2bd48f" icon="check_circle"        sub={`${Math.round((allResolved/allTotal)*100)}% resolution rate`} />
        <StatBox label="Highest volume"  value={topDept.name.split(' ')[0]} color="#c084fc" icon="leaderboard" sub={`${topDept.open + topDept.resolved} tickets total`} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 2, mb: 2 }}>
        {/* Bar chart */}
        <Card sx={{ p: 2.5, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8fa2c0', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
            Open vs resolved by department
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tfDeptLoad} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(143,162,192,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#5b6d8a', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={{ fill: '#5b6d8a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TFTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8fa2c0', paddingTop: 8 }} />
              <Bar dataKey="open"     name="Open"     fill="#ffb547" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#2bd48f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie + legend */}
        <Card sx={{ p: 2.5, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#8fa2c0', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
            Volume share
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<TFTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ mt: 1 }}>
            {tfDeptLoad.map(d => {
              const total = d.open + d.resolved;
              const pct   = allTotal > 0 ? Math.round((total / allTotal) * 100) : 0;
              return (
                <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                    <Typography sx={{ fontSize: 11.5, color: '#8fa2c0' }}>{d.name.split(' ')[0]}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#e6edf7' }}>{pct}%</Typography>
                </Box>
              );
            })}
          </Box>
        </Card>
      </Box>

      {/* Volume bars */}
      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          {tfDeptLoad.map(d => {
            const total = d.open + d.resolved;
            const pct   = allTotal > 0 ? Math.round((total / allTotal) * 100) : 0;
            return (
              <Box key={d.name} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#e6edf7' }}>{d.name}</Typography>
                    {d.breach > 0 && <Chip label={`${d.breach} breach`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }} />}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography sx={{ fontSize: 11.5, color: '#ffb547' }}>{d.open} open</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#2bd48f' }}>{d.resolved} resolved</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#5b6d8a' }}>{total} total</Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={pct} sx={{
                  height: 7, borderRadius: 4,
                  bgcolor: 'rgba(143,162,192,0.1)',
                  '& .MuiLinearProgress-bar': { bgcolor: d.color, borderRadius: 4 },
                }} />
              </Box>
            );
          })}
          <Insight
            color="#2ec8ff"
            icon="📊"
            text="IT Support generates the highest ticket volume. Consider whether current TLA headcount in this department is sufficient, or whether student self-service documentation could reduce repeat category tickets."
          />
        </Box>
        <Motivation text="Shows total ticket volume share per department to support resource allocation decisions and identify which departments generate the most support demand. This report is used in monthly reporting to MSS leadership to justify staffing and infrastructure investment." />
      </Card>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagerReports() {
  const [tab, setTab] = useState(0);
  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Manager
        </Typography>
        <Typography variant="h4" sx={{ color: '#e6edf7', fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>
          Reports &amp; Analytics
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#5b6d8a', mt: 0.5 }}>
          Generated {generated} · Data reflects current prototype seed
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': { bgcolor: ACCENT },
          '& .MuiTab-root': { color: '#5b6d8a', fontSize: 13, fontWeight: 600, textTransform: 'none', minWidth: 0, mr: 1 },
          '& .Mui-selected': { color: ACCENT },
        }}
      >
        <Tab label="📈 Ticket Trend" />
        <Tab label="🎯 SLA Compliance" />
        <Tab label="👤 TLA Workload" />
        <Tab label="🏢 Dept Volume" />
      </Tabs>

      {tab === 0 && <TicketTrendReport />}
      {tab === 1 && <SlaReport />}
      {tab === 2 && <WorkloadReport />}
      {tab === 3 && <DeptVolumeReport />}
    </Box>
  );
}