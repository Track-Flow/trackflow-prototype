import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Chip, CircularProgress, Alert,
} from '@mui/material';
import api from '../helpers/api';
import { statusMeta, timeAgo, getUserTickets } from '../helpers/ticketHelpers';

const ACCENT      = '#5a8dc4';
const PAPER       = '#111d2e';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = statusMeta(status);
  return (
    <Chip
      label={s.label.toUpperCase()}
      size="small"
      sx={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        height: 22, borderRadius: 1,
        bgcolor: `${s.color}20`, color: s.color,
        border: `1px solid ${s.color}44`,
      }}
    />
  );
}

// ─── Ticket row ───────────────────────────────────────────────────────────────
function TicketRow({ ticket, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        py: 1.5, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
        '&:last-child': { borderBottom: 'none' },
        '&:hover .ticket-title': { color: ACCENT },
        transition: 'all 0.15s',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2' }}>
            #{ticket.ticket_id}
          </Typography>
          {ticket.category_name && (
            <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>
              {ticket.category_name}
            </Typography>
          )}
        </Box>
        <Typography
          className="ticket-title"
          sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, mb: 0.3, transition: 'color 0.15s' }}
          noWrap
        >
          {ticket.ticket_title}
        </Typography>
        <Typography sx={{ fontSize: 11, color: TEXT_MUTED }}>
          Updated {timeAgo(ticket.updated_at ?? ticket.created_at)}
        </Typography>
      </Box>
      <Box sx={{ ml: 2, flexShrink: 0 }}>
        <StatusBadge status={ticket.ticket_status} />
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EndUserHome() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/tickets')
      .then(res => setTickets(getUserTickets(res.data, user?.id)))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  const activeTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.ticket_status));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontSize: 11, color: ACCENT, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5,
        }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', md: '2.125rem' }, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif' }}>
          How can we help you today?
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>

        {/* Quick actions */}
        <Card sx={{ flex: '1 1 280px', p: 3, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: ACCENT, mb: 1.5,
          }}>
            Quick Actions
          </Typography>
          <Typography variant="h6" sx={{ color: TEXT_BRIGHT, mb: 2.5 }}>
            Need something?
          </Typography>

          <Button
            fullWidth variant="contained"
            onClick={() => navigate('/submit')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>}
            sx={{ mb: 1.5, py: 1.25, fontSize: 14, fontWeight: 700 }}
          >
            Submit a new ticket
          </Button>

          <Button
            fullWidth variant="outlined"
            onClick={() => navigate('/home/tickets')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>}
            sx={{
              py: 1.1, fontSize: 13, color: TEXT_DIM, borderColor: BORDER,
              '&:hover': { borderColor: ACCENT, color: ACCENT },
            }}
          >
            View ticket history ({tickets.length})
          </Button>

          <Box sx={{
            mt: 2.5, p: 1.75, borderRadius: 2,
            background: 'rgba(90,141,196,0.06)',
            border: '1px solid rgba(90,141,196,0.15)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography sx={{ fontSize: 14 }}>💡</Typography>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: ACCENT, mb: 0.25 }}>Tip</Typography>
                <Typography sx={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.5 }}>
                  Choose <strong style={{ color: TEXT_BRIGHT }}>Other</strong> if no category fits —
                  Help-desk admin will route it for you.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* My tickets preview */}
        <Card sx={{ flex: '1 1 280px', p: 3, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography sx={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: ACCENT, mb: 0.25,
              }}>
                {activeTickets.length} Active
              </Typography>
              <Typography variant="h6" sx={{ color: TEXT_BRIGHT }}>My tickets</Typography>
            </Box>
            <Button
              size="small"
              endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>}
              onClick={() => navigate('/home/tickets')}
              sx={{ fontSize: 12, color: ACCENT }}
            >
              See all
            </Button>
          </Box>

          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: ACCENT }} />
            </Box>
          )}

          {!loading && tickets.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: TEXT_MUTED, display: 'block', marginBottom: 8 }}>
                inbox
              </span>
              <Typography sx={{ color: TEXT_DIM, fontSize: 13, mb: 1.5 }}>No tickets yet.</Typography>
              <Button variant="contained" size="small" onClick={() => navigate('/submit')}>
                Submit your first ticket
              </Button>
            </Box>
          )}

          {!loading && tickets.length > 0 && activeTickets.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#5a8f72', display: 'block', marginBottom: 8 }}>
                check_circle
              </span>
              <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>No active tickets — all clear!</Typography>
            </Box>
          )}

          {!loading && activeTickets.slice(0, 3).map(ticket => (
            <TicketRow
              key={ticket.ticket_id}
              ticket={ticket}
              onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
            />
          ))}
        </Card>
      </Box>
    </Box>
  );
}