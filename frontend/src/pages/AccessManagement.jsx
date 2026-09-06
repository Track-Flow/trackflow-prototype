import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Chip, Avatar, Button,
  Select, MenuItem, TextField, InputAdornment, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Skeleton,
} from '@mui/material';
import api from '../helpers/api';

const ACCENT     = '#ffb547';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';

const ROLES = ['end_user', 'tla', 'mss_manager', 'admin'];

const ROLE_META = {
  end_user:    { label: 'End User',    color: '#6fdcff' },
  tla:         { label: 'TLA',         color: '#2ec8ff' },
  mss_manager: { label: 'MSS Manager', color: '#ff9bd0' },
  admin:       { label: 'Help Desk',   color: '#ffb547' },
};

const STATUS_META = {
  active:   { label: 'Active',   color: '#2bd48f' },
  inactive: { label: 'Inactive', color: '#ff6b6b' },
};

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function groupByRole(users) {
  return ROLES.reduce((acc, role) => {
    const group = users.filter(u => u.user_role === role);
    if (group.length) acc[role] = group;
    return acc;
  }, {});
}

function UserRow({ user, departments, currentUserId, onSaved }) {
  const [role,     setRole]     = useState(user.user_role);
  const [status,   setStatus]   = useState(user.user_status);
  const [deptId,   setDeptId]   = useState(user.department_id ?? '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const isSelf  = user.user_id === currentUserId;
  const isDirty =
    role !== user.user_role ||
    status !== user.user_status ||
    (deptId || null) !== (user.department_id || null);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/users/${user.user_id}`, {
        user_role: role,
        user_status: status,
        department_id: deptId === '' ? null : deptId,
      });
      onSaved(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  }

  const roleMeta   = ROLE_META[role]     ?? { label: role,   color: TEXT_DIM };
  const statusMeta = STATUS_META[status] ?? { label: status, color: TEXT_DIM };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2, py: 1.5,
      borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap',
    }}>
      <Avatar sx={{
        width: 36, height: 36, fontSize: 13, fontWeight: 700,
        bgcolor: `${roleMeta.color}22`, color: roleMeta.color,
      }}>
        {getInitials(user.user_name)}
      </Avatar>

      <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
        <Typography sx={{ fontSize: 13.5, color: TEXT_BRIGHT, fontWeight: 600 }}>
          {user.user_name}
          {isSelf && (
            <Chip label="You" size="small" sx={{
              ml: 1, height: 16, fontSize: 9.5, bgcolor: `${ACCENT}22`, color: ACCENT, fontWeight: 700,
            }} />
          )}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: TEXT_DIM }}>{user.user_email}</Typography>
        <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontFamily: 'monospace', mt: 0.25 }}>
          {user.user_id}
        </Typography>
      </Box>

      <Select
        size="small"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={isSelf || saving}
        sx={{ minWidth: 140, fontSize: 12 }}
      >
        {ROLES.map(r => (
          <MenuItem key={r} value={r} sx={{ fontSize: 12 }}>{ROLE_META[r].label}</MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={deptId ?? ''}
        onChange={(e) => setDeptId(e.target.value)}
        disabled={saving}
        displayEmpty
        sx={{ minWidth: 160, fontSize: 12 }}
      >
        <MenuItem value="" sx={{ fontSize: 12, color: TEXT_DIM }}><em>No department</em></MenuItem>
        {departments.map(d => (
          <MenuItem key={d.department_id} value={d.department_id} sx={{ fontSize: 12 }}>
            {d.department_name}
          </MenuItem>
        ))}
      </Select>

      <Select
        size="small"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={isSelf || saving}
        sx={{
          minWidth: 110, fontSize: 12,
          color: statusMeta.color, fontWeight: 600,
        }}
      >
        {Object.entries(STATUS_META).map(([k, v]) => (
          <MenuItem key={k} value={k} sx={{ fontSize: 12, color: v.color, fontWeight: 600 }}>
            {v.label}
          </MenuItem>
        ))}
      </Select>

      <Box sx={{ minWidth: 90, display: 'flex', justifyContent: 'flex-end' }}>
        {error ? (
          <Typography sx={{ fontSize: 10.5, color: '#ff6b6b', maxWidth: 140 }}>{error}</Typography>
        ) : saved ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#2bd48f', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <Typography sx={{ fontSize: 12, color: '#2bd48f' }}>Saved</Typography>
          </Box>
        ) : (
          <Button
            size="small"
            variant={isDirty ? 'contained' : 'outlined'}
            disabled={!isDirty || saving}
            onClick={handleSave}
            sx={{
              fontSize: 11, py: 0.4, px: 1.5,
              ...(isDirty ? {
                background: `linear-gradient(135deg, ${ACCENT}, #e09030)`,
                color: '#070f1c',
              } : {
                borderColor: BORDER, color: TEXT_DIM,
              }),
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

function CreateTLADialog({ open, onClose, departments, onCreated }) {
  const [userId,     setUserId]     = useState('');
  const [userName,   setUserName]   = useState('');
  const [userEmail,  setUserEmail]  = useState('');
  const [password,   setPassword]   = useState('');
  const [deptId,     setDeptId]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  function reset() {
    setUserId(''); setUserName(''); setUserEmail('');
    setPassword(''); setDeptId(''); setError('');
  }

  async function handleCreate() {
    setError('');
    if (!userId.trim() || !userName.trim() || !userEmail.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/admin/users', {
        user_id: userId.trim(),
        user_name: userName.trim(),
        user_email: userEmail.trim(),
        password,
        department_id: deptId === '' ? null : deptId,
      });
      onCreated(data.user);
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create TLA.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>Create TLA account</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {error && <Alert severity="error" sx={{ fontSize: 12 }}>{error}</Alert>}
        <TextField
          label="Student / staff ID" size="small" value={userId}
          onChange={(e) => setUserId(e.target.value)} disabled={saving}
        />
        <TextField
          label="Full name" size="small" value={userName}
          onChange={(e) => setUserName(e.target.value)} disabled={saving}
        />
        <TextField
          label="Email" type="email" size="small" value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)} disabled={saving}
        />
        <TextField
          label="Initial password" type="password" size="small" value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={saving}
        />
        <Select
          size="small" value={deptId} onChange={(e) => setDeptId(e.target.value)}
          disabled={saving} displayEmpty
        >
          <MenuItem value=""><em>No department</em></MenuItem>
          {departments.map(d => (
            <MenuItem key={d.department_id} value={d.department_id}>{d.department_name}</MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: TEXT_DIM, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate} disabled={saving} variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${ACCENT}, #e09030)`,
            color: '#070f1c', textTransform: 'none', fontWeight: 700,
          }}
        >
          {saving ? 'Creating…' : 'Create TLA'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AccessManagement() {
  const [users,       setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState('');
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [createOpen,  setCreateOpen]  = useState(false);

  const currentUser  = JSON.parse(localStorage.getItem('tf_user') ?? 'null');
  const currentUserId = currentUser?.id;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/departments'),
        ]);
        if (cancelled) return;
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
      } catch (err) {
        if (!cancelled) setLoadError(err.response?.data?.error ?? 'Failed to load users.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function handleUpdated(updatedUser) {
    setUsers(prev => prev.map(u => u.user_id === updatedUser.user_id ? updatedUser : u));
  }

  function handleCreated(newUser) {
    setUsers(prev => [...prev, newUser]);
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.user_name.toLowerCase().includes(search.toLowerCase()) ||
      u.user_email.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.user_role === filter;
    return matchSearch && matchFilter;
  });

  const grouped = groupByRole(filtered);

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.user_role === r).length;
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
            Help Desk Admin
          </Typography>
          <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>User Access Management</Typography>
          <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
            Manage roles, departments, and account status for all TrackFlow users.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setCreateOpen(true)}
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>}
          sx={{
            background: `linear-gradient(135deg, ${ACCENT}, #e09030)`,
            color: '#070f1c', textTransform: 'none', fontWeight: 700,
          }}
        >
          Create TLA
        </Button>
      </Box>

      {loading ? (
        <>
          <Skeleton variant="rounded" height={90} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
          <Skeleton variant="rounded" height={280} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
        </>
      ) : loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : (
        <>
          {/* Role summary cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {ROLES.map(r => {
              const meta = ROLE_META[r];
              return (
                <Card
                  key={r}
                  onClick={() => setFilter(filter === r ? 'all' : r)}
                  sx={{
                    flex: '1 1 120px', p: 2, cursor: 'pointer', transition: 'all 0.15s',
                    border: filter === r ? `1px solid ${meta.color}66` : `1px solid ${BORDER}`,
                    background: filter === r ? `${meta.color}0d` : undefined,
                    '&:hover': { border: `1px solid ${meta.color}44` },
                  }}
                >
                  <Typography sx={{ fontSize: 10.5, color: TEXT_DIM, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
                    {meta.label}
                  </Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: meta.color, fontFamily: '"Rubik", sans-serif' }}>
                    {roleCounts[r] ?? 0}
                  </Typography>
                </Card>
              );
            })}
          </Box>

          {/* Search + filter bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name, email, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: TEXT_DIM }}>search</span>
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280 }}
            />
            {filter !== 'all' && (
              <Chip
                label={`Filtered: ${ROLE_META[filter]?.label}`}
                onDelete={() => setFilter('all')}
                size="small"
                sx={{ bgcolor: `${ROLE_META[filter]?.color}20`, color: ROLE_META[filter]?.color, fontWeight: 600 }}
              />
            )}
          </Box>

          {/* User list grouped by role */}
          {Object.entries(grouped).map(([role, roleUsers]) => {
            const meta = ROLE_META[role];
            return (
              <Card key={role} sx={{ mb: 2, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: meta.color }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {meta.label}
                  </Typography>
                  <Chip label={roleUsers.length} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: `${meta.color}15`, color: meta.color }} />
                </Box>

                {roleUsers.map(u => (
                  <UserRow
                    key={u.user_id}
                    user={u}
                    departments={departments}
                    currentUserId={currentUserId}
                    onSaved={handleUpdated}
                  />
                ))}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: TEXT_DIM, display: 'block', marginBottom: 12 }}>
                manage_accounts
              </span>
              <Typography sx={{ color: TEXT_DIM }}>No users match your search.</Typography>
            </Box>
          )}
        </>
      )}

      <CreateTLADialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        departments={departments}
        onCreated={handleCreated}
      />
    </Box>
  );
}