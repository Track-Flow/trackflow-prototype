import { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, Typography, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Chip,
  Snackbar, Alert as MuiAlert, Skeleton, Tabs, Tab,
  Switch, FormControlLabel, Tooltip, InputAdornment,
} from '@mui/material';
import api from '../helpers/api';

const PAPER      = '#111d2e';
const BASE       = '#0a1628';
const BORDER     = 'rgba(143,162,192,0.12)';
const TEXT_BRIGHT = '#e3e8f0';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const ACCENT      = '#5a8dc4';
const PURPLE      = '#7a6fa8';
const WARNING     = '#c49a4a';
const SUCCESS     = '#5a8f72';
const DANGER      = '#e5484d';

const Icon = ({ children, size = 18, style = {} }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, ...style }}>{children}</span>
);

// ─── Shared bits ──────────────────────────────────────────────────────────────

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

function EmptyState({ icon, title, body }) {
  return (
    <Card sx={{ p: 5, textAlign: 'center', bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2, mx: 'auto', mb: 2,
        display: 'grid', placeItems: 'center',
        background: 'rgba(90,141,196,0.08)', color: ACCENT,
      }}>
        <Icon size={24}>{icon}</Icon>
      </Box>
      <Typography sx={{ color: TEXT_BRIGHT, fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>{body}</Typography>
    </Card>
  );
}

// ─── Categories tab ───────────────────────────────────────────────────────────

function CategoryRow({ category, departments, onSave }) {
  const [name, setName] = useState(category.category_name);
  const [deptId, setDeptId] = useState(category.department_id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const dirty = name.trim() !== category.category_name || (deptId || null) !== (category.department_id ?? null);
  const isOther = category.category_name.toLowerCase() === 'other';

  async function handleSave() {
    if (!name.trim()) { setError('Category name cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(category.category_id, {
        category_name: name.trim(),
        department_id: deptId === '' ? null : deptId,
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
        <TextField
          size="small"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isOther}
          sx={{
            minWidth: 180, flex: '1 1 200px',
            '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT, fontSize: 13.5, fontWeight: 600 },
            '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 220px' }}>
          <Select
            value={deptId}
            onChange={e => setDeptId(e.target.value)}
            displayEmpty
            disabled={isOther}
            sx={{ color: TEXT_BRIGHT, fontSize: 13, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
          >
            <MenuItem value=""><em style={{ color: WARNING }}>No department (manual routing)</em></MenuItem>
            {departments.map(d => (
              <MenuItem key={d.department_id} value={d.department_id}>{d.department_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip
          size="small"
          label={`${category.ticket_count} ticket${category.ticket_count === 1 ? '' : 's'}`}
          sx={{ fontSize: 11, fontWeight: 600, bgcolor: 'rgba(143,162,192,0.1)', color: TEXT_DIM }}
        />

        {isOther ? (
          <Tooltip title="'Other' is reserved for manual routing and can't be edited.">
            <Chip size="small" icon={<Icon size={14}>lock</Icon>} label="Reserved" sx={{ fontSize: 11, bgcolor: 'rgba(196,154,74,0.12)', color: WARNING }} />
          </Tooltip>
        ) : (
          <Button
            size="small"
            variant={dirty ? 'contained' : 'outlined'}
            disabled={!dirty || saving}
            onClick={handleSave}
            sx={{
              fontSize: 12, fontWeight: 700, minWidth: 84,
              ...(dirty ? { bgcolor: ACCENT, '&:hover': { bgcolor: '#4a7db4' } } : { color: TEXT_DIM, borderColor: BORDER }),
            }}
          >
            {saving ? 'Saving…' : saved ? <Icon size={16}>check</Icon> : 'Save'}
          </Button>
        )}
      </Box>
      {error && <Typography sx={{ fontSize: 11.5, color: DANGER, mt: 1 }}>{error}</Typography>}
      {!isOther && (
        <Typography sx={{ fontSize: 11, color: TEXT_MUTED, mt: 0.75 }}>
          Changes apply to future ticket routing only — existing tickets keep their original category.
        </Typography>
      )}
    </Card>
  );
}

function CreateCategoryDialog({ open, onClose, onCreated, departments }) {
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() { setName(''); setDeptId(''); setError(''); }

  async function handleCreate() {
    if (!name.trim()) { setError('Category name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/categories', {
        category_name: name.trim(),
        department_id: deptId === '' ? null : deptId,
      });
      onCreated(res.data.category);
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create category.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="xs" fullWidth
      PaperProps={{ sx: { bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT_BRIGHT, fontWeight: 700 }}>New category</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="Category name" size="small" value={name} autoFocus
          onChange={e => setName(e.target.value)}
          InputLabelProps={{ sx: { color: TEXT_DIM } }}
          sx={{ '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT }, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
        />
        <FormControl size="small">
          <InputLabel sx={{ color: TEXT_DIM }}>Department</InputLabel>
          <Select
            label="Department" value={deptId}
            onChange={e => setDeptId(e.target.value)}
            sx={{ color: TEXT_BRIGHT, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
          >
            <MenuItem value=""><em>No department (manual routing)</em></MenuItem>
            {departments.map(d => (
              <MenuItem key={d.department_id} value={d.department_id}>{d.department_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED }}>
          This drives automatic routing — tickets in this category will route to the selected department.
        </Typography>
        {error && <Typography sx={{ fontSize: 12, color: DANGER }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { reset(); onClose(); }} sx={{ color: TEXT_DIM }}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={loading}
          sx={{ bgcolor: ACCENT, fontWeight: 700, '&:hover': { bgcolor: '#4a7db4' } }}>
          {loading ? 'Creating…' : 'Create category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoriesTab({ categories, departments, loading, onSave, onCreated }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '' });

  const unrouted = categories.filter(c => !c.department_id);

  async function handleSave(id, payload) {
    await onSave(id, payload);
    setSnack({ open: true, message: 'Category updated.' });
  }

  function handleCreated(category) {
    onCreated(category);
    setSnack({ open: true, message: `"${category.category_name}" created.` });
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total categories" value={categories.length} color={ACCENT} />
        <StatCard label="Manual routing" value={unrouted.length} color={WARNING} />
        <StatCard label="Departments" value={departments.length} color={PURPLE} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM }}>
          Category list is shown to end users when they submit a ticket.
        </Typography>
        <Button
          variant="contained" size="small"
          startIcon={<Icon size={16}>add</Icon>}
          onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: ACCENT, fontWeight: 700, '&:hover': { bgcolor: '#4a7db4' } }}
        >
          New category
        </Button>
      </Box>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5, bgcolor: 'rgba(143,162,192,0.08)' }} />)
      ) : categories.length === 0 ? (
        <EmptyState icon="category" title="No categories yet" body="Create the first category to start routing tickets." />
      ) : (
        categories.map(cat => (
          <CategoryRow key={cat.category_id} category={cat} departments={departments} onSave={handleSave} />
        ))
      )}

      <CreateCategoryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreated={handleCreated} departments={departments} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <MuiAlert severity="success" variant="filled" sx={{ bgcolor: SUCCESS, color: '#0a1628', fontWeight: 700 }}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

// ─── Departments tab ──────────────────────────────────────────────────────────

function DepartmentRow({ department, onSave }) {
  const [name, setName] = useState(department.department_name);
  const [active, setActive] = useState(department.department_status === 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const targetStatus = active ? 'active' : 'inactive';
  const dirty = name.trim() !== department.department_name || targetStatus !== department.department_status;

  async function handleSave() {
    if (!name.trim()) { setError('Department name cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(department.department_id, { department_name: name.trim(), department_status: targetStatus });
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
        <IconButton size="small" onClick={() => setExpanded(e => !e)} sx={{ color: TEXT_DIM }}>
          <Icon size={18}>{expanded ? 'expand_less' : 'expand_more'}</Icon>
        </IconButton>

        <TextField
          size="small"
          value={name}
          onChange={e => setName(e.target.value)}
          sx={{
            minWidth: 180, flex: '1 1 220px',
            '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT, fontSize: 13.5, fontWeight: 600 },
            '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' },
          }}
        />

        <Chip
          size="small"
          icon={<Icon size={14}>groups</Icon>}
          label={`${department.tlas.length} TLA${department.tlas.length === 1 ? '' : 's'}`}
          sx={{ fontSize: 11, fontWeight: 600, bgcolor: 'rgba(143,162,192,0.1)', color: TEXT_DIM }}
        />

        <FormControlLabel
          control={<Switch size="small" checked={active} onChange={e => setActive(e.target.checked)} sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: SUCCESS },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: SUCCESS },
          }} />}
          label={<Typography sx={{ fontSize: 12, color: active ? SUCCESS : WARNING, fontWeight: 700 }}>
            {active ? 'Active' : 'Inactive'}
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
            ...(dirty ? { bgcolor: ACCENT, '&:hover': { bgcolor: '#4a7db4' } } : { color: TEXT_DIM, borderColor: BORDER }),
          }}
        >
          {saving ? 'Saving…' : saved ? <Icon size={16}>check</Icon> : 'Save'}
        </Button>
      </Box>

      {error && <Typography sx={{ fontSize: 11.5, color: DANGER, mt: 1 }}>{error}</Typography>}
      {!active && (
        <Typography sx={{ fontSize: 11, color: WARNING, mt: 0.75 }}>
          Inactive departments are excluded from automatic ticket routing.
        </Typography>
      )}

      {expanded && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${BORDER}` }}>
          {department.tlas.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: TEXT_MUTED, fontStyle: 'italic' }}>No TLAs assigned to this department.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {department.tlas.map(t => (
                <Chip key={t.user_id} size="small" label={t.user_name}
                  sx={{ fontSize: 11.5, bgcolor: 'rgba(90,141,196,0.1)', color: ACCENT, fontWeight: 600 }} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
}

function CreateDepartmentDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() { setName(''); setError(''); }

  async function handleCreate() {
    if (!name.trim()) { setError('Department name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/departments', { department_name: name.trim() });
      onCreated(res.data.department);
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create department.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="xs" fullWidth
      PaperProps={{ sx: { bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2 } }}>
      <DialogTitle sx={{ color: TEXT_BRIGHT, fontWeight: 700 }}>New department</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="Department name" size="small" value={name} autoFocus
          onChange={e => setName(e.target.value)}
          InputLabelProps={{ sx: { color: TEXT_DIM } }}
          sx={{ '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT }, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
        />
        <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED }}>
          New departments start active and can be linked to categories and users right away.
        </Typography>
        {error && <Typography sx={{ fontSize: 12, color: DANGER }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { reset(); onClose(); }} sx={{ color: TEXT_DIM }}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={loading}
          sx={{ bgcolor: ACCENT, fontWeight: 700, '&:hover': { bgcolor: '#4a7db4' } }}>
          {loading ? 'Creating…' : 'Create department'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DepartmentsTab({ departments, loading, onSave, onCreated }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '' });
  const [search, setSearch] = useState('');

  const activeCount = departments.filter(d => d.department_status === 'active').length;
  const totalTlas = departments.reduce((sum, d) => sum + d.tlas.length, 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter(d => d.department_name.toLowerCase().includes(q));
  }, [departments, search]);

  async function handleSave(id, payload) {
    await onSave(id, payload);
    setSnack({ open: true, message: 'Department updated.' });
  }

  function handleCreated(department) {
    onCreated(department);
    setSnack({ open: true, message: `"${department.department_name}" created.` });
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total departments" value={departments.length} color={PURPLE} />
        <StatCard label="Active" value={activeCount} color={SUCCESS} />
        <StatCard label="Inactive" value={departments.length - activeCount} color={WARNING} />
        <StatCard label="Total TLAs" value={totalTlas} color={ACCENT} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search departments…"
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Icon size={16} style={{ color: TEXT_MUTED }}>search</Icon></InputAdornment> }}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { color: TEXT_BRIGHT, fontSize: 13 }, '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' } }}
        />
        <Button
          variant="contained" size="small"
          startIcon={<Icon size={16}>add</Icon>}
          onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: PURPLE, fontWeight: 700, '&:hover': { bgcolor: '#6a5f98' } }}
        >
          New department
        </Button>
      </Box>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5, bgcolor: 'rgba(143,162,192,0.08)' }} />)
      ) : filtered.length === 0 ? (
        <EmptyState icon="groups" title={search ? 'No matches' : 'No departments yet'} body={search ? 'Try a different search term.' : 'Create the first department to start assigning TLAs and categories.'} />
      ) : (
        filtered.map(dept => (
          <DepartmentRow key={dept.department_id} department={dept} onSave={handleSave} />
        ))
      )}

      <CreateDepartmentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreated={handleCreated} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <MuiAlert severity="success" variant="filled" sx={{ bgcolor: SUCCESS, color: '#0a1628', fontWeight: 700 }}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManageCategoriesDepartments() {
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function loadAll() {
    setLoading(true);
    setLoadError('');
    try {
      const [catRes, deptRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/departments'),
      ]);
      setCategories(catRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      setLoadError(err.response?.data?.error ?? 'Failed to load categories and departments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSaveCategory(id, payload) {
    const res = await api.patch(`/admin/categories/${id}`, payload);
    setCategories(prev => prev.map(c => c.category_id === id ? res.data.category : c));
  }

  function handleCategoryCreated(category) {
    setCategories(prev => [...prev, category].sort((a, b) => a.category_name.localeCompare(b.category_name)));
  }

  async function handleSaveDepartment(id, payload) {
    const res = await api.patch(`/admin/departments/${id}`, payload);
    setDepartments(prev => prev.map(d => d.department_id === id ? res.data.department : d));
  }

  function handleDepartmentCreated(department) {
    setDepartments(prev => [...prev, department].sort((a, b) => a.department_name.localeCompare(b.department_name)));
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 11, color: WARNING, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          Help Desk Admin
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>Categories &amp; Departments</Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          Manage what routes where. Categories drive automatic ticket routing; departments hold the TLAs who receive them.
        </Typography>
      </Box>

      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          mb: 2.5, minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, fontSize: 13, fontWeight: 700, color: TEXT_DIM, textTransform: 'none' },
          '& .Mui-selected': { color: `${ACCENT} !important` },
          '& .MuiTabs-indicator': { bgcolor: ACCENT },
        }}
      >
        <Tab label="Categories" icon={<Icon size={16}>category</Icon>} iconPosition="start" />
        <Tab label="Departments" icon={<Icon size={16}>groups</Icon>} iconPosition="start" />
      </Tabs>

      {loadError && (
        <MuiAlert severity="error" sx={{ mb: 2, bgcolor: 'rgba(229,72,77,0.1)', color: DANGER }}>
          {loadError}
        </MuiAlert>
      )}

      {tab === 0 && (
        <CategoriesTab
          categories={categories} departments={departments} loading={loading}
          onSave={handleSaveCategory} onCreated={handleCategoryCreated}
        />
      )}
      {tab === 1 && (
        <DepartmentsTab
          departments={departments} loading={loading}
          onSave={handleSaveDepartment} onCreated={handleDepartmentCreated}
        />
      )}
    </Box>
  );
}