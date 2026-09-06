import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, Typography, Chip, TextField, InputAdornment,
  Select, MenuItem, FormControl, Switch, FormControlLabel,
  Button, Avatar, Skeleton, Snackbar, Alert as MuiAlert,
} from '@mui/material';
import api from '../helpers/api';

const PAPER       = '#111d2e';
const BORDER      = 'rgba(148,163,184,0.10)';
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

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

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

function TLARow({ tla, departments, onSave }) {
  const [deptId, setDeptId]   = useState(tla.department_id ?? '');
  const [active, setActive]   = useState(tla.user_status === 'active');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const targetStatus = active ? 'active' : 'inactive';
  const dirty =
    (deptId || null) !== (tla.department_id ?? null) ||
    targetStatus !== tla.user_status;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(tla.user_id, {
        department_id: deptId === '' ? null : deptId,
        user_status: targetStatus,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card sx={{ p: 2, mb: 1.5, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Avatar sx={{
          width: 36, height: 36, fontSize: 13, fontWeight: 700,
          bgcolor: `${ACCENT}22`, color: ACCENT, flexShrink: 0,
        }}>
          {getInitials(tla.user_name)}
        </Avatar>

        <Box sx={{ flex: '1 1 180px', minWidth: 140 }}>
          <Typography sx={{ fontSize: 13.5, color: TEXT_BRIGHT, fontWeight: 600 }}>
            {tla.user_name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{tla.user_email}</Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 200px' }}>
          <Select
            value={deptId}
            onChange={e => setDeptId(e.target.value)}
            displayEmpty
            sx={{ color: TEXT_BRIGHT, fontSize: 13, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
          >
            <MenuItem value=""><em style={{ color: WARNING }}>No department</em></MenuItem>
            {departments.map(d => (
              <MenuItem key={d.department_id} value={d.department_id}>{d.department_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch size="small" checked={active} onChange={e => setActive(e.target.checked)} sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: SUCCESS },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: SUCCESS },
          }} />}
          label={<Typography sx={{ fontSize: 12, color: active ? SUCCESS : DANGER, fontWeight: 700 }}>
            {active ? 'Active' : 'Removed'}
          </Typography>}
          sx={{ mr: 0 }}
        />

        <Button
          size="small"
          variant={dirty ? 'contained' : 'outlined'}
          disabled={!dirty || saving}
          onClick={handleSave}
          sx={{
            fontSize: 12, fontWeight: 700, minWidth: 84,
            ...(dirty ? { bgcolor: ACCENT, '&:hover': { bgcolor: '#6a5f98' } } : { color: TEXT_DIM, borderColor: BORDER }),
          }}
        >
          {saving ? 'Saving…' : saved ? <Icon size={16}>check</Icon> : 'Save'}
        </Button>
      </Box>

      {error && <Typography sx={{ fontSize: 11.5, color: DANGER, mt: 1 }}>{error}</Typography>}
      {!active && (
        <Typography sx={{ fontSize: 11, color: DANGER, mt: 0.75 }}>
          This TLA can't log in while removed. Toggle back to Active to restore access — the account isn't deleted.
        </Typography>
      )}
    </Card>
  );
}

export default function ManagerTLAs() {
  const [tlas, setTlas]               = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState('');
  const [search, setSearch]           = useState('');
  const [deptFilter, setDeptFilter]   = useState('all');
  const [snack, setSnack]             = useState({ open: false, message: '' });

  async function loadAll() {
    setLoading(true);
    setLoadError('');
    try {
      const [tlaRes, deptRes] = await Promise.all([
        api.get('/admin/manager/tlas'),
        api.get('/admin/departments'),
      ]);
      setTlas(tlaRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      setLoadError(err.response?.data?.error ?? 'Failed to load TLAs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSave(userId, payload) {
    const res = await api.patch(`/admin/manager/tlas/${userId}`, payload);
    setTlas(prev => prev.map(t => t.user_id === userId ? res.data.tla : t));
    setSnack({ open: true, message: `${res.data.tla.user_name} updated.` });
  }

  const filtered = useMemo(() => {
    return tlas.filter(t => {
      const matchDept =
        deptFilter === 'all' ||
        (deptFilter === 'unassigned' && t.department_id == null) ||
        String(t.department_id) === String(deptFilter);
      const q = search.trim().toLowerCase();
      const matchSearch = !q
        || t.user_name.toLowerCase().includes(q)
        || t.user_email.toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [tlas, search, deptFilter]);

  const activeCount     = tlas.filter(t => t.user_status === 'active').length;
  const removedCount    = tlas.length - activeCount;
  const unassignedCount = tlas.filter(t => t.department_id == null).length;

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          MSS Manager
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>
          TLAs
        </Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          Every TLA across all departments. Move someone to a different department or remove them from active duty.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total TLAs"  value={tlas.length}      color={ACCENT} />
        <StatCard label="Active"      value={activeCount}      color={SUCCESS} />
        <StatCard label="Removed"     value={removedCount}     color={DANGER} />
        <StatCard label="Unassigned"  value={unassignedCount}  color={WARNING} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search TLAs…"
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Icon size={16} style={{ color: TEXT_MUTED }}>search</Icon></InputAdornment> }}
          sx={{ flex: '1 1 220px', minWidth: 0, '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT, fontSize: 13 }, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
        />
        <FormControl size="small" sx={{ flex: '1 1 180px', minWidth: 0 }}>
          <Select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            sx={{ color: TEXT_BRIGHT, fontSize: 13, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
          >
            <MenuItem value="all">All departments</MenuItem>
            <MenuItem value="unassigned">Unassigned {unassignedCount > 0 && `(${unassignedCount})`}</MenuItem>
            {departments.map(d => (
              <MenuItem key={d.department_id} value={d.department_id}>{d.department_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loadError && (
        <MuiAlert severity="error" sx={{ mb: 2, bgcolor: 'rgba(229,72,77,0.1)', color: DANGER }}>
          {loadError}
        </MuiAlert>
      )}

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={78} sx={{ mb: 1.5, bgcolor: 'rgba(143,162,192,0.08)' }} />)
      ) : filtered.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: TEXT_DIM, fontSize: 13.5 }}>
            {tlas.length === 0 ? 'No TLAs yet.' : 'No TLAs match your filters.'}
          </Typography>
        </Card>
      ) : (
        filtered.map(tla => (
          <TLARow key={tla.user_id} tla={tla} departments={departments} onSave={handleSave} />
        ))
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <MuiAlert severity="success" variant="filled" sx={{ bgcolor: SUCCESS, color: '#0a1628', fontWeight: 700 }}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}