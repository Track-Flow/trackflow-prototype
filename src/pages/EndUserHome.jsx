import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, Chip } from '@mui/material';
import { tfTickets, getStatus, timeAgo } from '../data/mockData';

const ACCENT    = '#6fdcff';
const TEXT_DIM  = '#8fa2c0';
const TEXT_BRIGHT = '#e6edf7';
const BORDER    = 'rgba(143,162,192,0.12)';

// Only show tickets belonging to Thando (userId 9)
const MY_TICKETS = tfTickets.filter(t => t.requesterId === 9);
const ACTIVE     = MY_TICKETS.filter(t => !['resolved', 'closed'].includes(t.status));

function StatusBadge({ status }) {
  const s = getStatus(status);
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

function CategoryDot({ category }) {
  const colors = {
    'IT Support': '#2ec8ff', 'Facilities': '#ffb547',
    'Administration': '#c084fc', 'Library Services': '#2bd48f', 'Other': '#ff9bd0',
  };
  const color = colors[category] ?? '#8fa2c0';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: 11, color }}>{category}</Typography>
    </Box>
  );
}

function TicketRow({ ticket, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        py: 1.5, px: 0,
        borderBottom: `1px solid ${BORDER}`,
        cursor: 'pointer',
        '&:last-child': { borderBottom: 'none' },
        '&:hover .ticket-title': { color: ACCENT },
        transition: 'all 0.15s',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#5b8ec2' }}>
            {ticket.id}
          </Typography>
          <CategoryDot category={ticket.category} />
        </Box>
        <Typography
          className="ticket-title"
          sx={{ fontSize: 13.5, fontWeight: 600, color: TEXT_BRIGHT, mb: 0.3, transition: 'color 0.15s' }}
          noWrap
        >
          {ticket.title}
        </Typography>
        <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>
          Updated {timeAgo(ticket.updatedAt)}
        </Typography>
      </Box>
      <Box sx={{ ml: 2, flexShrink: 0 }}>
        <StatusBadge status={ticket.status} />
      </Box>
    </Box>
  );
}

export default function EndUserHome({ extraTickets = [] }) {
  const navigate = useNavigate();
  const allMyTickets = [...extraTickets.filter(t => t.requesterId === 9), ...MY_TICKETS];
  const activeTickets = allMyTickets.filter(t => !['resolved', 'closed'].includes(t.status));

  return (
    <Box>
      {/* Welcome header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontSize: 11, color: ACCENT, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5,
        }}>
          Welcome back, Thando
        </Typography>
        <Typography variant="h4" sx={{ color: TEXT_BRIGHT }}>
          How can we help you today?
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>

        {/* Quick actions card */}
        <Card sx={{ flex: '1 1 340px', p: 3 }}>
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
            fullWidth
            variant="contained"
            onClick={() => navigate('/submit')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>}
            sx={{ mb: 1.5, py: 1.25, fontSize: 14, fontWeight: 700 }}
          >
            Submit a new ticket
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/home/tickets')}
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>}
            sx={{
              py: 1.1, fontSize: 13, color: TEXT_DIM,
              borderColor: BORDER,
              '&:hover': { borderColor: ACCENT, color: ACCENT },
            }}
          >
            View ticket history ({allMyTickets.length})
          </Button>

          {/* Tip */}
          <Box sx={{
            mt: 2.5, p: 1.75, borderRadius: 2,
            background: 'rgba(111,220,255,0.06)',
            border: '1px solid rgba(111,220,255,0.12)',
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

        {/* My tickets card */}
        <Card sx={{ flex: '1 1 400px', p: 3 }}>
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

          {activeTickets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: TEXT_DIM, display: 'block', marginBottom: 8 }}>
                check_circle
              </span>
              <Typography sx={{ color: TEXT_DIM, fontSize: 13 }}>No active tickets — all clear!</Typography>
            </Box>
          ) : (
            activeTickets.slice(0, 3).map(ticket => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              />
            ))
          )}
        </Card>
      </Box>
    </Box>
  );
}