import { useState } from 'react';
import {
  Box, Card, Typography, TextField, Button,
  InputAdornment, IconButton, Divider, Alert,
} from '@mui/material';

import api from '../helpers/api.js';
import { useNavigate } from 'react-router-dom';

const LOGO_BLUE = '#2ec8ff';
const BG        = '#0a1628';
const CARD_BG   = '#0f1f3a';
const BORDER    = 'rgba(143,162,192,0.12)';

function TFWordmark() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
      <Typography sx={{
        fontFamily: '"Rubik", sans-serif', fontWeight: 700, fontSize: 26,
        letterSpacing: '-0.03em', color: '#e6edf7',
      }}>
        <span style={{ color: LOGO_BLUE }}>TRACK</span>FLOW
      </Typography>
    </Box>
  );
}

function GridBg() {
  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(46,200,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(46,200,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }} />
  );
}

function GlowBlob({ x, y, color = LOGO_BLUE, size = 480, opacity = 0.07 }) {
  return (
    <Box sx={{
      position: 'fixed', zIndex: 0, pointerEvents: 'none',
      width: size, height: size, borderRadius: '50%',
      background: color, filter: 'blur(90px)', opacity,
      left: x, top: y, transform: 'translate(-50%, -50%)',
    }} />
  );
}

function PasswordStrength({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]
    .filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ff6b6b', '#ffb547', '#2ec8ff', '#2bd48f'];
  if (!password) return null;
  return (
    <Box sx={{ mt: -1 }}>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} sx={{
            flex: 1, height: 3, borderRadius: 1,
            background: i <= score ? colors[score] : 'rgba(143,162,192,0.15)',
            transition: 'background .2s',
          }} />
        ))}
      </Box>
      <Typography sx={{ fontSize: 11.5, color: colors[score] }}>{labels[score]}</Typography>
    </Box>
  );
}

export default function RegisterPage() {

  const navigate = useNavigate();
  const [form, setForm] = useState({
    userId: '', firstName: '', lastName: '', email: '', password: '', confirm: '',
  });
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e) => {
  e.preventDefault();
  const { userId, firstName, lastName, email, password, confirm } = form;

  if (!userId || !firstName || !lastName || !email || !password || !confirm) {
    setError('Please fill in all fields.'); return;
  }
  if (password !== confirm) {
    setError('Passwords do not match.'); return;
  }
  if (password.length < 8) {
    setError('Password must be at least 8 characters.'); return;
  }

  setError('');
  setLoading(true);

  try {
    await api.post('/auth/register', {
      user_id:  userId.trim(),
      user_name:     `${firstName.trim()} ${lastName.trim()}`,
      user_email:    email.trim().toLowerCase(),
      password,
      role:     'end_user',
    });

    setSuccess(true);
    setTimeout(() => navigate('/login'), 2000);

  } catch (err) {
    setError(err.response?.data?.error ?? 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{
      minHeight: '100vh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      px: 2, py: 4, position: 'relative', overflow: 'hidden',
    }}>
      <GridBg />
      <GlowBlob x="80%" y="20%" color={LOGO_BLUE} size={500} opacity={0.06} />
      <GlowBlob x="20%" y="80%" color="#c084fc"   size={400} opacity={0.05} />

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <TFWordmark />
          <Typography sx={{ fontSize: 12, color: '#5b6d8a', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
            Wits University · MSS
          </Typography>
        </Box>

        <Card sx={{
          p: 3.5, background: CARD_BG,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.6)',
        }}>
          <Typography variant="h5" sx={{ color: '#e6edf7', mb: 0.5 }}>Create account</Typography>
          <Typography sx={{ fontSize: 13.5, color: '#5b6d8a', mb: 3 }}>
            Register with your Wits student or staff number.
          </Typography>

          {error && <Alert severity="error"   sx={{ mb: 2.5, fontSize: 13 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2.5, fontSize: 13 }}>Account created! Redirecting to sign in…</Alert>}

          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            <TextField
              label="Student / Staff number"
              value={form.userId}
              onChange={set('userId')}
              autoFocus
              fullWidth
              helperText="e.g. 123456 or EMP0012"
              FormHelperTextProps={{ sx: { color: '#5b6d8a', fontSize: 11.5 } }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField label="First name" value={form.firstName} onChange={set('firstName')} fullWidth />
              <TextField label="Last name"  value={form.lastName}  onChange={set('lastName')}  fullWidth />
            </Box>

            <TextField
              label="Email address" type="email"
              value={form.email} onChange={set('email')}
              autoComplete="email" fullWidth
              helperText="Use your @wits.ac.za address"
              FormHelperTextProps={{ sx: { color: '#5b6d8a', fontSize: 11.5 } }}
            />

            <TextField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password} onChange={set('password')} fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(p => !p)} edge="end" sx={{ color: '#5b6d8a' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <PasswordStrength password={form.password} />

            <TextField
              label="Confirm password"
              type={showPw ? 'text' : 'password'}
              value={form.confirm} onChange={set('confirm')} fullWidth
              error={!!form.confirm && form.confirm !== form.password}
              helperText={form.confirm && form.confirm !== form.password ? 'Passwords do not match' : ''}
            />

            <Button
              type="submit" variant="contained" size="large" fullWidth
              disabled={loading || success}
              sx={{ mt: 0.5, py: 1.3, fontSize: 15, fontWeight: 700 }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: BORDER }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13.5, color: '#5b6d8a' }}>
              Already have an account?{' '}
              <Typography component="span" onClick={() => navigate('/login')}
                sx={{ color: LOGO_BLUE, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Sign in
              </Typography>
            </Typography>
          </Box>
        </Card>

        <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: 11.5, color: '#2e3e55' }}>
          © {new Date().getFullYear()} TrackFlow Solutions · Mathematical Sciences Support
        </Typography>
      </Box>
    </Box>
  );
}