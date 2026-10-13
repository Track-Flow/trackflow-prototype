import { useState } from 'react';
import {
  Box, Card, Typography, TextField, Button,
  InputAdornment, IconButton, Divider, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../helpers/api.js';

const ACCENT      = '#5a8dc4';
const BG_MAIN     = '#0c1422';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_MUTED  = '#64748b';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';

const helperSx = { sx: { color: TEXT_MUTED, fontSize: 11.5 } };

function TFLogo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3.5 }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: '8px', background: ACCENT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fff', fontVariationSettings: "'FILL' 1" }}>
          confirmation_number
        </span>
      </Box>
      <Box>
        <Typography sx={{
          fontFamily: '"Rubik", sans-serif', fontWeight: 700, fontSize: 22,
          letterSpacing: '-0.01em', lineHeight: 1, color: TEXT_BRIGHT,
        }}>
          <span style={{ color: ACCENT }}>TRACK</span>FLOW
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
          Wits University · MSS
        </Typography>
      </Box>
    </Box>
  );
}

function PasswordStrength({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]
    .filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#b85c52', '#c49a4a', '#5a8dc4', '#5a8f72'];
  if (!password) return null;
  return (
    <Box sx={{ mt: -1 }}>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} sx={{
            flex: 1, height: 3, borderRadius: 1,
            background: i <= score ? colors[score] : 'rgba(148,163,184,0.15)',
            transition: 'background .2s',
          }} />
        ))}
      </Box>
      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: colors[score] }}>{labels[score]}</Typography>
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
        user_id:    userId.trim(),
        user_name:  `${firstName.trim()} ${lastName.trim()}`,
        user_email: email.trim().toLowerCase(),
        password,
        role:       'end_user',
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mismatch = !!form.confirm && form.confirm !== form.password;

  return (
    <Box sx={{
      minHeight: '100vh', background: BG_MAIN,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      px: 2, py: 4,
    }}>
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <TFLogo />

        <Card sx={{ p: { xs: 3, sm: 3.5 } }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 700, color: ACCENT,
            letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.75,
          }}>
            Get started
          </Typography>
          <Typography variant="h5" sx={{ color: TEXT_BRIGHT, mb: 0.5 }}>Create account</Typography>
          <Typography sx={{ fontSize: 13, color: TEXT_DIM, mb: 3 }}>
            Register with your Wits student or staff number.
          </Typography>

          {error   && <Alert severity="error"   sx={{ mb: 2.5, fontSize: 13 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2.5, fontSize: 13 }}>Account created! Redirecting to sign in…</Alert>}

          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Student / Staff number"
              value={form.userId}
              onChange={set('userId')}
              autoFocus
              fullWidth
              helperText="e.g. 123456 or EMP0012"
              FormHelperTextProps={helperSx}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 1.5 } }}>
              <TextField label="First name" value={form.firstName} onChange={set('firstName')} autoComplete="given-name"  fullWidth />
              <TextField label="Last name"  value={form.lastName}  onChange={set('lastName')}  autoComplete="family-name" fullWidth />
            </Box>

            <TextField
              label="Email address" type="email"
              value={form.email} onChange={set('email')}
              autoComplete="email" fullWidth
              helperText="Use your @wits.ac.za address"
              FormHelperTextProps={helperSx}
            />

            <TextField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              autoComplete="new-password" fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPw(p => !p)}
                      edge="end"
                      sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_DIM } }}
                    >
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
              value={form.confirm} onChange={set('confirm')}
              autoComplete="new-password" fullWidth
              error={mismatch}
              helperText={mismatch ? 'Passwords do not match' : ''}
            />

            <Button
              type="submit" variant="contained" size="large" fullWidth
              disabled={loading || success}
              sx={{ mt: 0.5, py: 1.2, fontSize: 14 }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: BORDER }} />

          <Typography sx={{ fontSize: 13, color: TEXT_DIM, textAlign: 'center' }}>
            Already have an account?{' '}
            <Typography
              component="button"
              type="button"
              onClick={() => navigate('/login')}
              sx={{
                color: ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                background: 'none', border: 'none', p: 0, fontFamily: 'inherit',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign in
            </Typography>
          </Typography>
        </Card>

        <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: 11, color: TEXT_MUTED, opacity: 0.6 }}>
          © {new Date().getFullYear()} TrackFlow Solutions · Mathematical Sciences Support
        </Typography>
      </Box>
    </Box>
  );
}