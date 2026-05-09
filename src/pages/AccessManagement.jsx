import { useState } from 'react';
import {
  Box, Typography, Card, Chip, Avatar, Button,
  Select, MenuItem, TextField, InputAdornment, Divider,
} from '@mui/material';
import { tfUsers } from '../data/mockData';

const ACCENT     = '#ffb547';
const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';

const ROLES = ['end_user', 'tla', 'mss_manager', 'helpdesk_admin'];

const ROLE_META = {
  end_user:       { label: 'End User',    color: '#6fdcff' },
  tla:            { label: 'TLA',         color: '#2ec8ff' },
  mss_manager:    { label: 'MSS Manager', color: '#ff9bd0' },
  helpdesk_admin: { label: 'Help Desk',   color: '#ffb547' },
};

const STATUS_META = {
  active:   { label: 'Active',   color: '#2bd48f' },
  inactive: { label: 'Inactive', color: '#ff6b6b' },
};

// Augment mock users with status
const INITIAL_USERS = tfUsers.map(u => ({
  ...u,
  status: 'active',
}));

function groupByRole(users) {
  return ROLES.reduce((acc, role) => {
    const group = users.filter(u => u.role === role);
    if (group.length) acc[role] = group;
    return acc;
  }, {});
}

function UserRow({ user, onUpdate }) {
  const [role,   setRole]   = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [saved,  setSaved]  = useState(false);

  const isDirty = role !== user.role || status !== user.status;

  function handleSave() {
    onUpdate(user.id, { role, status });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const roleMeta   = ROLE_META[role]   ?? { label: role,   color: '#8fa2c0' };
  const statusMeta = STATUS_META[status] ?? { label: status, color: '#8fa2c0' };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      py: 1.5, borderBottom: `1px solid ${BORDER}`,
      flexWrap: 'wrap',
      '&:last-child': { borderBottom: 'none' },
    }}>
      {/* Avatar + name */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 180px', minWidth: 160 }}>
        <Avatar sx={{ width: 34, height: 34, fontSize: 11, fontWeight: 700, bgcolor: `${user.color}20`, color: user.color }}>
          {user.initials}
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: TEXT_BRIGHT }}>{user.name}</Typography>
          {user.sub && <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{user.sub}</Typography>}
        </Box>
      </Box>

      {/* Role selector */}
      <Select
        size="small"
        value={role}
        onChange={e => { setRole(e.target.value); setSaved(false); }}
        sx={{
          fontSize: 12, minWidth: 150,
          color: roleMeta.color,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: `${roleMeta.color}44` },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: roleMeta.color },
        }}
      >
        {ROLES.map(r => (
          <MenuItem key={r} value={r}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ROLE_META[r]?.color }} />
              <Typography sx={{ fontSize: 12.5 }}>{ROLE_META[r]?.label ?? r}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>

      {/* Status selector */}
      <Select
        size="small"
        value={status}
        onChange={e => { setStatus(e.target.value); setSaved(false); }}
        sx={{
          fontSize: 12, minWidth: 120,
          color: statusMeta.color,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: `${statusMeta.color}44` },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: statusMeta.color },
        }}
      >
        <MenuItem value="active">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#2bd48f' }} />
            Active
          </Box>
        </MenuItem>
        <MenuItem value="inactive">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ff6b6b' }} />
            Inactive
          </Box>
        </MenuItem>
      </Select>

      {/* Save button */}
      <Box sx={{ minWidth: 90, display: 'flex', justifyContent: 'flex-end' }}>
        {saved ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#2bd48f', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <Typography sx={{ fontSize: 12, color: '#2bd48f' }}>Saved</Typography>
          </Box>
        ) : (
          <Button
            size="small"
            variant={isDirty ? 'contained' : 'outlined'}
            disabled={!isDirty}
            onClick={handleSave}
            sx={{
              fontSize: 11, py: 0.4, px: 1.5,
              ...(isDirty ? {
                background: `linear-gradient(135deg, ${ACCENT}, #e09030)`,
                color: '#070f1c',
              } : {
                borderColor: BORDER,
                color: TEXT_DIM,
              }),
            }}
          >
            Save
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default function AccessManagement() {
  const [users,  setUsers]  = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  function handleUpdate(id, changes) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  const grouped = groupByRole(filtered);

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>
          Help Desk Admin
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>User Access Management</Typography>
        <Typography sx={{ fontSize: 13, color: TEXT_DIM, mt: 0.5 }}>
          Manage roles and account status for all TrackFlow users.
        </Typography>
      </Box>

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
                {roleCounts[r]}
              </Typography>
            </Card>
          );
        })}
      </Box>

      {/* Search + filter bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search users…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: TEXT_DIM }}>search</span>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
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
              <UserRow key={u.id} user={u} onUpdate={handleUpdate} />
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
    </Box>
  );
}