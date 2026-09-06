import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, Typography, Chip, TextField, InputAdornment, Skeleton, Alert as MuiAlert,
} from '@mui/material';
import api from '../helpers/api';

const PAPER       = '#111d2e';
const BORDER      = 'rgba(143,162,192,0.12)';
const TEXT_BRIGHT = '#e3e8f0';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const ACCENT      = '#7a6fa8'; // manager accent
const SUCCESS     = '#5a8f72';
const WARNING     = '#c49a4a';
const DANGER      = '#e5484d';

const Icon = ({ children, size = 18, style = {} }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, ...style }}>{children}</span>
);

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ flex: '1 1 140px', p: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
      <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 800, color, fontFamily: '"Rubik", sans-serif' }}>
        {value}
      </Typography>
    </Card>
  );
}

function DepartmentCard({ department }) {
  const active = department.department_status === 'active';
  return (
    <Card sx={{ p: 2.25, mb: 1.5, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: TEXT_BRIGHT }}>
          {department.department_name}
        </Typography>
        <Chip
          size="small"
          label={active ? 'Active' : 'Inactive'}
          sx={{
            fontSize: 11, fontWeight: 700,
            bgcolor: active ? 'rgba(90,143,114,0.14)' : 'rgba(196,154,74,0.14)',
            color: active ? SUCCESS : WARNING,
          }}
        />
      </Box>

      <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.75 }}>
        {department.tlas.length} TLA{department.tlas.length === 1 ? '' : 's'}
      </Typography>

      {department.tlas.length === 0 ? (
        <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED, fontStyle: 'italic' }}>No TLAs assigned.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {department.tlas.map(t => (
            <Chip
              key={t.user_id}
              size="small"
              icon={<Icon size={13} style={{ color: ACCENT }}>person</Icon>}
              label={t.user_name}
              sx={{ fontSize: 12, bgcolor: 'rgba(122,111,168,0.1)', color: TEXT_BRIGHT, fontWeight: 500 }}
            />
          ))}
        </Box>
      )}
    </Card>
  );
}

export default function ManagerDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/departments');
        setDepartments(res.data);
      } catch (err) {
        setError(err.response?.data?.error ?? 'Failed to load departments.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter(d =>
      d.department_name.toLowerCase().includes(q) ||
      d.tlas.some(t => t.user_name.toLowerCase().includes(q))
    );
  }, [departments, search]);

  const activeCount = departments.filter(d => d.department_status === 'active').length;
  const totalTlas   = departments.reduce((sum, d) => sum + d.tlas.length, 0);
  const unstaffed   = departments.filter(d => d.tlas.length === 0).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Manager
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>Departments</Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          All departments and the TLAs assigned to each. To add a department or reassign staff, contact a Help Desk admin.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total departments" value={departments.length} color={ACCENT} />
        <StatCard label="Active" value={activeCount} color={SUCCESS} />
        <StatCard label="Unstaffed" value={unstaffed} color={WARNING} />
        <StatCard label="Total TLAs" value={totalTlas} color="#5a8dc4" />
      </Box>

      <TextField
        size="small" placeholder="Search departments or TLAs…"
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Icon size={16} style={{ color: TEXT_MUTED }}>search</Icon></InputAdornment> }}
        sx={{ mb: 2, minWidth: 260, '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT, fontSize: 13 }, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
      />

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2, bgcolor: 'rgba(229,72,77,0.1)', color: DANGER }}>
          {error}
        </MuiAlert>
      )}

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={92} sx={{ mb: 1.5, bgcolor: 'rgba(143,162,192,0.08)' }} />)
      ) : filtered.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: TEXT_DIM, fontSize: 13.5 }}>No departments match your search.</Typography>
        </Card>
      ) : (
        filtered.map(dept => <DepartmentCard key={dept.department_id} department={dept} />)
      )}
    </Box>
  );
}