import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Avatar, Alert, Chip, Divider, Skeleton } from '@mui/material';
import api from '../helpers/api';

const BG_CARD     = '#111d2e';
const BG_STAT     = '#0e1828';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_MUTED  = '#94a3b8';
const TEXT_DIM    = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

const ROLE_ACCENT = {
  tla:         '#5a8dc4',
  mss_manager: '#7a6fa8',
  end_user:    '#5a8dc4',
  admin:       '#c49a4a',
};

const ROLE_LABEL = {
  tla:         'Technical Lab Assistant',
  mss_manager: 'MSS Manager',
  end_user:    'End User',
  admin:       'Admin / Help Desk',
};

const STATUS_COLORS = {
  active:   '#5a8f72',
  inactive: '#8b5e6a',
};

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function StatCard({ label, value, accent }) {
  return (
    <Box sx={{
      flex: '1 1 140px', minWidth: 120,
      background: BG_STAT, border: `1px solid ${BORDER}`, borderRadius: 1.5,
      p: 1.75, textAlign: 'center',
    }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: TEXT_MUTED, mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.1, borderBottom: `1px solid ${BORDER}` }}>
      <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>{value}</Typography>
    </Box>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get('/users/me');
        if (cancelled) return;
        setProfile(data.user);
        setStats(data.stats);
        setUserName(data.user.name);
        setUserEmail(data.user.email);
      } catch (err) {
        if (!cancelled) setLoadError(err.response?.data?.error ?? 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function startEdit() {
    setUserName(profile.name);
    setUserEmail(profile.email);
    setSaveError('');
    setSuccess(false);
    setEditing(true);
  }

  function cancelEdit() {
    setUserName(profile.name);
    setUserEmail(profile.email);
    setSaveError('');
    setEditing(false);
  }

  async function handleSave() {
    setSaveError('');
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', {
        user_name: userName,
        user_email: userEmail,
      });

      const updatedProfile = { ...profile, name: data.user.user_name, email: data.user.user_email };
      setProfile(updatedProfile);

      const stored = JSON.parse(localStorage.getItem('tf_user') ?? 'null');
      localStorage.setItem('tf_user', JSON.stringify({
        ...stored,
        name: data.user.user_name,
        email: data.user.user_email,
      }));

      setEditing(false);
      setSuccess(true);
    } catch (err) {
      setSaveError(err.response?.data?.error ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {loading ? (
          <>
            <Skeleton variant="rounded" height={180} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
            <Skeleton variant="rounded" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
          </>
        ) : loadError || !profile ? (
          <Alert severity="error">{loadError || 'Could not load profile.'}</Alert>
        ) : (
          <>
            {/* ── Header card ── */}
            <Paper sx={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 2, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, flexWrap: 'wrap' }}>
                <Avatar sx={{
                  width: 64, height: 64, fontSize: 22, fontWeight: 700,
                  bgcolor: `${ROLE_ACCENT[profile.role] ?? '#5a8dc4'}22`,
                  color: ROLE_ACCENT[profile.role] ?? '#5a8dc4',
                }}>
                  {getInitials(profile.name)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: TEXT_BRIGHT }}>
                    {profile.name}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: TEXT_MUTED, mb: 1 }}>
                    {profile.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip
                      label={ROLE_LABEL[profile.role] ?? profile.role}
                      size="small"
                      sx={{
                        background: `${ROLE_ACCENT[profile.role] ?? '#5a8dc4'}18`,
                        color: ROLE_ACCENT[profile.role] ?? '#5a8dc4',
                        fontWeight: 600, fontSize: 11,
                      }}
                    />
                    {profile.department_name && (
                      <Chip
                        label={profile.department_name}
                        size="small"
                        sx={{ background: 'rgba(255,255,255,0.05)', color: TEXT_DIM, fontSize: 11 }}
                      />
                    )}
                    <Chip
                      label={profile.status}
                      size="small"
                      sx={{
                        background: `${STATUS_COLORS[profile.status] ?? TEXT_DIM}18`,
                        color: STATUS_COLORS[profile.status] ?? TEXT_DIM,
                        fontWeight: 600, fontSize: 11, textTransform: 'capitalize',
                      }}
                    />
                  </Box>
                </Box>

                {!editing && (
                  <Button
                    size="small"
                    onClick={startEdit}
                    sx={{
                      color: ROLE_ACCENT[profile.role] ?? '#5a8dc4',
                      textTransform: 'none', fontWeight: 600, fontSize: 12.5,
                    }}
                    startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </Paper>

            {/* ── Stats ── */}
            {stats && Object.keys(stats).length > 0 && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                {profile.role === 'tla' && (
                  <>
                    <StatCard label="Assigned to you" value={stats.assigned_total} accent={ROLE_ACCENT.tla} />
                    <StatCard label="Currently active" value={stats.assigned_active} accent="#c49a4a" />
                    <StatCard label="Resolved" value={stats.resolved_total} accent="#5a8f72" />
                    <StatCard label="Closed" value={stats.closed_total} accent={TEXT_DIM} />
                  </>
                )}
                {profile.role === 'end_user' && (
                  <>
                    <StatCard label="Tickets submitted" value={stats.submitted_total} accent={ROLE_ACCENT.end_user} />
                    <StatCard label="Open" value={stats.submitted_open} accent="#c49a4a" />
                    <StatCard label="Resolved" value={stats.submitted_resolved} accent="#5a8f72" />
                  </>
                )}
                {(profile.role === 'mss_manager' || profile.role === 'admin') && (
                  <StatCard label="Status changes logged" value={stats.logged_actions} accent={ROLE_ACCENT[profile.role]} />
                )}
              </Box>
            )}

            {/* ── Details / edit card ── */}
            <Paper sx={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 2, p: 3 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT, mb: 1.5 }}>
                Account details
              </Typography>

              {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
              {success && !editing && <Alert severity="success" sx={{ mb: 2 }}>Profile updated.</Alert>}

              {!editing ? (
                <>
                  <InfoRow label="Username" value={profile.name} />
                  <InfoRow label="Email" value={profile.email} />
                  <InfoRow label="Role" value={ROLE_LABEL[profile.role] ?? profile.role} />
                  <InfoRow label="Department" value={profile.department_name ?? '—'} />
                  <InfoRow label="User ID" value={profile.id} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.1 }}>
                    <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED }}>Member since</Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>
                      {formatDate(profile.created_at)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED, mb: 2 }}>
                    Only username and email can be changed here.
                  </Typography>
                  <TextField
                    label="Username"
                    fullWidth
                    size="small"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    size="small"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Divider sx={{ borderColor: BORDER, my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      onClick={cancelEdit}
                      disabled={saving}
                      sx={{ color: TEXT_MUTED, textTransform: 'none' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        background: ROLE_ACCENT[profile.role] ?? '#5a8dc4',
                        '&:hover': { background: ROLE_ACCENT[profile.role] ?? '#5a8dc4' },
                        textTransform: 'none', fontWeight: 600,
                      }}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}