import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Button, TextField,
  Avatar, Divider,
} from '@mui/material';
import { tfTickets, tfUsers, getStatus, timeAgo, getUser } from '../data/mockData';

const TEXT_DIM   = '#8fa2c0';
const TEXT_BRIGHT= '#e6edf7';
const BORDER     = 'rgba(143,162,192,0.12)';

const CAT_COLORS = {
  'IT Support': '#2ec8ff', 'Facilities': '#ffb547',
  'Administration': '#c084fc', 'Library Services': '#2bd48f', 'Other': '#ff9bd0',
};

// Static mock comments per ticket
const MOCK_COMMENTS = {
  'TF-1842': [
    { id: 1, authorId: 1, text: 'Hi Thando, I can see the issue on our end. Your VPN session is timing out at the gateway. Can you confirm which version of GlobalProtect you\'re running?', createdAt: '2025-04-22T09:00:00Z' },
    { id: 2, authorId: 9, text: 'Hi Lerato, I\'m running version 6.1.2. Let me know if you need anything else.', createdAt: '2025-04-22T09:30:00Z' },
    { id: 3, authorId: 1, text: 'Thanks. I\'ve pushed a config update to your profile. Please disconnect and reconnect — the 15-minute timeout should be resolved.', createdAt: '2025-04-22T10:15:00Z' },
  ],
  'TF-1837': [
    { id: 1, authorId: 2, text: 'We\'ve logged this with facilities. A technician is scheduled for tomorrow morning.', createdAt: '2025-04-22T07:30:00Z' },
  ],
};

function StatusChip({ status }) {
  const s = getStatus(status);
  return <Chip label={s.label} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 24, bgcolor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}44` }} />;
}



function CommentBubble({ comment }) {
  const author = getUser(comment.authorId);
  const isTLA  = author?.role === 'tla';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
      <Avatar sx={{ width: 32, height: 32, fontSize: 11, fontWeight: 700, flexShrink: 0, bgcolor: `${author?.color ?? '#8fa2c0'}20`, color: author?.color ?? '#8fa2c0' }}>
        {author?.initials ?? '??'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT_BRIGHT }}>{author?.name ?? 'Unknown'}</Typography>
          {isTLA && <Chip label="TLA" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(46,200,255,0.15)', color: '#2ec8ff' }} />}
          <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{timeAgo(comment.createdAt)}</Typography>
        </Box>
        <Box sx={{
          p: 1.5, borderRadius: 2, fontSize: 13, lineHeight: 1.6,
          background: isTLA ? 'rgba(46,200,255,0.06)' : 'rgba(143,162,192,0.06)',
          border: `1px solid ${isTLA ? 'rgba(46,200,255,0.15)' : BORDER}`,
          color: TEXT_BRIGHT,
        }}>
          {comment.text}
        </Box>
      </Box>
    </Box>
  );
}

function InfoRow({ label, children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' } }}>
      <Typography sx={{ fontSize: 12, color: TEXT_DIM }}>{label}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}

export default function TicketDetail({ extraTickets = [] }) {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const ticket     = [...extraTickets, ...tfTickets].find(t => t.id === id);
  const [reply, setReply] = useState('');
  const [comments, setComments] = useState(MOCK_COMMENTS[id] ?? []);
  const [sending, setSending]   = useState(false);

  if (!ticket) {
    return (
      <Box sx={{ textAlign: 'center', pt: 8 }}>
        <Typography variant="h5" sx={{ color: TEXT_BRIGHT, mb: 1 }}>Ticket not found</Typography>
        <Typography sx={{ color: TEXT_DIM, mb: 3 }}>#{id} doesn't exist in the prototype.</Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>Go back</Button>
      </Box>
    );
  }

  const requester = getUser(ticket.requesterId);
  const assignee  = ticket.assigneeId ? getUser(ticket.assigneeId) : null;
  const catColor  = CAT_COLORS[ticket.category] ?? '#8fa2c0';

  function handleSend() {
    if (!reply.trim()) return;
    setSending(true);
    setTimeout(() => {
      setComments(prev => [...prev, {
        id: prev.length + 1,
        authorId: 9,
        text: reply.trim(),
        createdAt: new Date().toISOString(),
      }]);
      setReply('');
      setSending(false);
    }, 600);
  }

  return (
    <Box>
      {/* Back button */}
      <Button
        startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>}
        onClick={() => navigate(-1)}
        sx={{ color: TEXT_DIM, mb: 2, '&:hover': { color: TEXT_BRIGHT } }}
      >
        Back
      </Button>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Main content */}
        <Box sx={{ flex: '1 1 480px', minWidth: 0 }}>
          {/* Header */}
          <Card sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: '#5b8ec2' }}>{ticket.id}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: catColor }} />
                <Typography sx={{ fontSize: 12, color: catColor }}>{ticket.category}</Typography>
              </Box>
              <StatusChip status={ticket.status} />
            </Box>

            <Typography variant="h5" sx={{ color: TEXT_BRIGHT, mb: 1.5 }}>
              {ticket.title}
            </Typography>

            <Typography sx={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.7 }}>
              {ticket.description}
            </Typography>
          </Card>

          {/* Comments */}
          <Card sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 2 }}>
              Activity ({comments.length})
            </Typography>

            {comments.length === 0 ? (
              <Typography sx={{ color: TEXT_DIM, fontSize: 13, mb: 2 }}>No replies yet.</Typography>
            ) : (
              comments.map(c => <CommentBubble key={c.id} comment={c} />)
            )}

            <Divider sx={{ borderColor: BORDER, mb: 2 }} />

            {/* Reply box */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(111,220,255,0.2)', color: '#6fdcff', flexShrink: 0 }}>
                TK
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a reply or update…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  disabled={!reply.trim() || sending}
                  onClick={handleSend}
                  endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>}
                >
                  Send reply
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Sidebar info */}
        <Box sx={{ flex: '0 0 260px' }}>
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
              Ticket info
            </Typography>

            <InfoRow label="Status"><StatusChip status={ticket.status} /></InfoRow>
            <InfoRow label="Category">
              <Typography sx={{ fontSize: 12.5, color: catColor, fontWeight: 600 }}>{ticket.category}</Typography>
            </InfoRow>

            <InfoRow label="Submitted">
              <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{timeAgo(ticket.createdAt)}</Typography>
            </InfoRow>
            <InfoRow label="Updated">
              <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{timeAgo(ticket.updatedAt)}</Typography>
            </InfoRow>

            <Divider sx={{ borderColor: BORDER, my: 1.5 }} />

            <Typography sx={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
              People
            </Typography>

            <InfoRow label="Requester">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: `${requester?.color ?? '#8fa2c0'}25`, color: requester?.color }}>
                  {requester?.initials}
                </Avatar>
                <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{requester?.name ?? '—'}</Typography>
              </Box>
            </InfoRow>

            <InfoRow label="Assigned to">
              {assignee ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: `${assignee.color}25`, color: assignee.color }}>
                    {assignee.initials}
                  </Avatar>
                  <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{assignee.name}</Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: 12, color: '#ffb547' }}>Unassigned</Typography>
              )}
            </InfoRow>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}