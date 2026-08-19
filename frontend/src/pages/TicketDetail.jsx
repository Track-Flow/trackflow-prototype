// ─── TicketDetail.jsx ───────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, CircularProgress, Alert, Button,
  Chip, Avatar, Divider, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import api from '../helpers/api';
import { statusMeta, priorityMeta, timeAgo } from '../helpers/ticketHelpers';

const PAPER      = '#111d2e';
const BORDER     = 'rgba(148,163,184,0.10)';
const TEXT_DIM   = '#94a3b8';
const TEXT_MUTED = '#64748b';
const TEXT_BRIGHT= '#e3e8f0';

const ROLE_ACCENT = {
  tla: '#5a8dc4', mss_manager: '#7a6fa8', end_user: '#5a8dc4', admin: '#c49a4a',
};

const STATUS_COLORS = {
  open: '#5a8dc4', in_progress: '#c49a4a', struggling: '#8b5e6a',
  resolved: '#5a8f72', closed: '#475569',
};

const STATUS_ICONS = {
  open: 'inbox', in_progress: 'pending_actions', struggling: 'flag',
  resolved: 'check_circle', closed: 'lock',
};

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart}, ${timePart}`;
}

// ─── Note dialog (Resolve + Struggling + Reopen) ──────────────────────────────
function NoteDialog({ open, mode, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('');
  const handleConfirm = () => { onConfirm(notes); setNotes(''); };
  const handleCancel  = () => { onCancel();        setNotes(''); };

  const configByMode = {
    resolved: {
      icon: 'check_circle', iconColor: '#5a8f72',
      title: 'Resolve Ticket',
      helper: 'Add resolution notes before marking this ticket as resolved.',
      placeholder: 'Describe how the issue was resolved…',
      confirmLabel: 'Resolve', confirmColor: 'success', confirmIcon: 'check',
    },
    struggling: {
      icon: 'flag', iconColor: '#8b5e6a',
      title: 'Flag as Struggling',
      helper: "Let the team know what you're stuck on before flagging this ticket.",
      placeholder: "What are you stuck on?",
      confirmLabel: 'Flag as Struggling', confirmColor: 'error', confirmIcon: 'flag',
    },
    reopen: {
      icon: 'restart_alt', iconColor: '#c49a4a',
      title: 'Reopen Ticket',
      helper: 'Explain why this ticket is being reopened. The requester will be notified.',
      placeholder: 'Reason for reopening (e.g. issue recurred, resolution incomplete)…',
      confirmLabel: 'Reopen', confirmColor: 'warning', confirmIcon: 'restart_alt',
    },
  };

  const config = configByMode[mode] ?? configByMode.resolved;

  return (
    <Dialog open={open} onClose={handleCancel} PaperProps={{
      sx: { bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2, minWidth: { xs: '92vw', sm: 420 } },
    }}>
      <DialogTitle sx={{ color: TEXT_BRIGHT, fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-outlined" style={{ color: config.iconColor, fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
            {config.icon}
          </span>
          {config.title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: TEXT_DIM, fontSize: 13, mb: 2 }}>{config.helper}</Typography>
        <TextField
          autoFocus multiline rows={4} fullWidth
          placeholder={config.placeholder}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: TEXT_BRIGHT, fontSize: 13,
              '& fieldset': { borderColor: 'rgba(143,162,192,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(143,162,192,0.4)' },
              '&.Mui-focused fieldset': { borderColor: config.iconColor },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined"
          sx={{ color: TEXT_DIM, borderColor: 'rgba(143,162,192,0.2)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm} disabled={!notes.trim()}
          variant="contained" color={config.confirmColor}
          startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>{config.confirmIcon}</span>}
        >
          {config.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Lifecycle / history dialog ───────────────────────────────────────────────
function HistoryEntry({ entry, isLast }) {
  const color = STATUS_COLORS[entry.new_status] ?? TEXT_MUTED;
  const icon  = STATUS_ICONS[entry.new_status] ?? 'update';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: isLast ? 0 : 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
          bgcolor: `${color}20`, border: `1px solid ${color}55`,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </Box>
        {!isLast && (
          <Box sx={{ flex: 1, width: 1, bgcolor: BORDER, mt: 0.5, minHeight: 24 }} />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT_BRIGHT, mb: 0.25 }}>
          {statusMeta(entry.new_status)?.label ?? entry.new_status}
          {entry.old_status && (
            <span style={{ color: TEXT_MUTED, fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
              from {statusMeta(entry.old_status)?.label ?? entry.old_status}
            </span>
          )}
        </Typography>
        {entry.note && (
          <Typography sx={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, mb: 0.5, whiteSpace: 'pre-wrap' }}>
            {entry.note}
          </Typography>
        )}
        <Typography sx={{ fontSize: 11, color: TEXT_MUTED }}>
          {entry.changed_by_name ?? entry.changed_by} · {formatDateTime(entry.changed_at)}
        </Typography>
      </Box>
    </Box>
  );
}

function HistoryDialog({ open, onClose, ticketId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!open || !ticketId) return;
    setLoading(true);
    setError('');
    api.get(`/tickets/${ticketId}/history`)
      .then(res => setHistory(res.data))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, [open, ticketId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{
      sx: { bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2.5, maxHeight: '85vh' },
    }}>
      <DialogTitle sx={{ color: TEXT_BRIGHT, fontWeight: 700, fontSize: 17, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-outlined" style={{ color: '#5a8dc4', fontSize: 20 }}>history</span>
          Ticket lifecycle
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: BORDER, px: 2.5, py: 2, maxHeight: '60vh' }}>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: '#5a8dc4' }} />
          </Box>
        )}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && history.length === 0 && (
          <Typography sx={{ color: TEXT_DIM, fontSize: 13, textAlign: 'center', py: 3 }}>
            No status changes recorded yet.
          </Typography>
        )}
        {!loading && !error && history.length > 0 && (
          <Box sx={{ pt: 0.5 }}>
            {history.map((entry, i) => (
              <HistoryEntry key={entry.log_id} entry={entry} isLast={i === history.length - 1} />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5, flexShrink: 0 }}>
        <Button onClick={onClose} size="small" sx={{ color: TEXT_DIM }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Small info row ───────────────────────────────────────────────────────────
function InfoRow({ label, children }) {
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      py: 1.25, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' },
    }}>
      <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>{label}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}

// ─── Comment bubble (local-only for now) ──────────────────────────────────────
function CommentBubble({ comment }) {
  const isTLA = comment.authorRole === 'tla';
  const accent = ROLE_ACCENT[comment.authorRole] ?? '#94a3b8';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
      <Avatar sx={{ width: 32, height: 32, fontSize: 11, fontWeight: 700, flexShrink: 0, bgcolor: `${accent}20`, color: accent }}>
        {getInitials(comment.authorName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: TEXT_BRIGHT }}>{comment.authorName}</Typography>
          {isTLA && <Chip label="TLA" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: `${accent}22`, color: accent }} />}
          <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>{timeAgo(comment.createdAt)}</Typography>
        </Box>
        <Box sx={{
          p: 1.5, borderRadius: 2, fontSize: 13, lineHeight: 1.6,
          background: isTLA ? `${accent}0d` : 'rgba(148,163,184,0.06)',
          border: `1px solid ${isTLA ? `${accent}26` : BORDER}`,
          color: TEXT_BRIGHT, whiteSpace: 'pre-wrap',
        }}>
          {comment.text}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TicketDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('tf_user') ?? 'null');

  const [ticket,     setTicket]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [noteDialog, setNoteDialog] = useState({ open: false, mode: null });
  const [claiming,   setClaiming]   = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // TODO: replace with GET /api/tickets/:id/comments when endpoint exists
  const [comments, setComments] = useState([]);
  const [reply,    setReply]    = useState('');
  const [sending,  setSending]  = useState(false);

  const fetchTicket = () => {
    setLoading(true);
    api.get(`/tickets/${id}`)
      .then(res => setTicket(res.data))
      .catch(err => setError(err.response?.data?.error ?? 'Failed to load ticket.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const backPath = {
    tla: '/tla', mss_manager: '/manager', end_user: '/home', admin: '/helpdesk',
  }[user?.role] ?? '/';

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(backPath);
    }
  };

  const handleNoteConfirm = async (notes) => {
    const mode = noteDialog.mode;
    setNoteDialog({ open: false, mode: null });
    // Reopen maps to ticket_status = 'open'; other modes send their mode directly.
    const nextStatus = mode === 'reopen' ? 'open' : mode;
    try {
      await api.patch(`/tickets/${id}`, {
        ticket_status: nextStatus,
        resolution_notes: notes,
      });
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to update ticket.');
    }
  };

  const patchStatus = async (newStatus) => {
    try {
      await api.patch(`/tickets/${id}`, { ticket_status: newStatus });
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to update ticket.');
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError('');
    try {
      // No ticket_status sent — backend auto-progresses to in_progress on claim
      await api.patch(`/tickets/${id}`, { assignee_id: user?.id });
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to claim ticket. It may already be claimed.');
    } finally {
      setClaiming(false);
    }
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    setSending(true);
    // TODO: POST /api/tickets/:id/comments — for now, local-only
    setTimeout(() => {
      setComments(prev => [...prev, {
        id: prev.length + 1,
        authorName: user?.name ?? 'You',
        authorRole: user?.role,
        text: reply.trim(),
        createdAt: new Date().toISOString(),
      }]);
      setReply('');
      setSending(false);
    }, 300);
  };

  if (loading) return (
    <Box sx={{ p: 6, textAlign: 'center' }}>
      <CircularProgress size={28} sx={{ color: '#5a8dc4' }} />
    </Box>
  );

  if (error && !ticket) return (
    <Box>
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      <Button
        startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>}
        onClick={handleBack}
        sx={{ color: TEXT_DIM, mb: 2, '&:hover': { color: TEXT_BRIGHT } }}
      >
        Back
      </Button>
    </Box>
  );

  if (!ticket) return null;

  const { label: sLabel, color: sColor } = statusMeta(ticket.ticket_status);
  const { label: pLabel, color: pColor } = priorityMeta(ticket.ticket_priority ?? 'low');

  const assignedUserId  = ticket.assigned_user_id ?? ticket.assignee_id;
  const assigneeName    = ticket.assignee_name;
  const assigneeFirst   = assigneeName ? assigneeName.split(' ')[0] : null;
  const assigneeDisplay = assigneeName ?? assignedUserId ?? null;

  const isResolved      = ticket.ticket_status === 'resolved';
  const isClosed        = ticket.ticket_status === 'closed';
  const isStruggling    = ticket.ticket_status === 'struggling';
  const isClaimed       = assignedUserId != null;
  const isAssignedToMe  = assignedUserId === user?.id;
  const isTLA           = user?.role === 'tla';
  const isManager       = user?.role === 'mss_manager';
  const isAdmin         = user?.role === 'admin';

  const canClaim  = isTLA && !isClaimed && !isResolved && !isClosed;
  const canManage = isTLA && isAssignedToMe && !isResolved && !isClosed;
  // Reopen: TLA (must be assignee), Manager, or Admin — only when resolved/closed
  const canReopen = (isResolved || isClosed) && (
    (isTLA && isAssignedToMe) || isManager || isAdmin
  );

  return (
    <Box>
      <Button
        startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>}
        onClick={handleBack}
        sx={{ color: TEXT_DIM, mb: 2, '&:hover': { color: TEXT_BRIGHT } }}
      >
        Back
      </Button>

      <Button
        fullWidth
        onClick={() => setHistoryOpen(true)}
        startIcon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>}
        sx={{
          fontSize: 13.5, fontWeight: 700, color: '#5a8dc4', mb: 2,
          py: 1.1, borderRadius: 2,
          bgcolor: 'rgba(90,141,196,0.10)', border: '1px solid rgba(90,141,196,0.35)',
          '&:hover': { bgcolor: 'rgba(90,141,196,0.18)', borderColor: 'rgba(90,141,196,0.55)' },
        }}
      >
        View ticket lifecycle
      </Button>

      {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Main content */}
        <Box sx={{ flex: '1 1 480px', minWidth: 0 }}>

          {/* Header card */}
          <Card sx={{ p: 3, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: '#5a8dc4', fontWeight: 700 }}>
                #{ticket.ticket_id}
              </Typography>
              <Chip label={sLabel} size="small" sx={{
                fontSize: 11, fontWeight: 700, height: 22,
                bgcolor: `${sColor}20`, color: sColor, border: `1px solid ${sColor}44`,
              }} />
              <Chip label={pLabel} size="small" sx={{
                fontSize: 11, fontWeight: 700, height: 22,
                bgcolor: `${pColor}20`, color: pColor, border: `1px solid ${pColor}44`,
              }} />
              {ticket.ticket_escalated === 1 && (
                <Chip label="ESCALATED" size="small" sx={{
                  fontSize: 10, fontWeight: 800, height: 22, letterSpacing: '0.06em',
                  bgcolor: 'rgba(229,72,77,0.15)', color: '#e5484d', border: '1px solid rgba(229,72,77,0.4)',
                }} />
              )}
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: TEXT_BRIGHT, mb: 1.5, lineHeight: 1.3 }}>
              {ticket.ticket_title}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {ticket.ticket_description}
            </Typography>

            {ticket.resolution_note && (
              <Box sx={{
                mt: 2.5, p: 2, borderRadius: 1.5,
                bgcolor: 'rgba(90,143,114,0.08)', border: '1px solid rgba(90,143,114,0.3)',
              }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: '#5a8f72', letterSpacing: '0.08em', mb: 0.75 }}>
                  RESOLUTION NOTE
                </Typography>
                <Typography sx={{ fontSize: 13, color: TEXT_BRIGHT, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {ticket.resolution_note}
                </Typography>
              </Box>
            )}
          </Card>

          {/* Actions — Unclaimed TLA */}
          {canClaim && (
            <Card sx={{ p: 2.5, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
              <Typography sx={{
                fontSize: 11, color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5,
              }}>
                Actions
              </Typography>
              <Button
                variant="contained"
                onClick={handleClaim}
                disabled={claiming}
                startIcon={
                  claiming
                    ? <CircularProgress size={13} sx={{ color: '#0a1628' }} />
                    : <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_add</span>
                }
                sx={{ fontSize: 12, fontWeight: 700 }}
              >
                {claiming ? 'Claiming…' : 'Claim ticket'}
              </Button>
            </Card>
          )}

          {/* Actions — TLA, assigned to me */}
          {canManage && (
            <Card sx={{ p: 2.5, mb: 2, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
              <Typography sx={{
                fontSize: 11, color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5,
              }}>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ticket.ticket_status === 'struggling' && (
                  <Button
                    variant="outlined" size="small"
                    onClick={() => patchStatus('in_progress')}
                    startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>play_arrow</span>}
                    sx={{ fontSize: 12, color: '#c49a4a', borderColor: 'rgba(196,154,74,0.4)' }}
                  >
                    Resume
                  </Button>
                )}
                {ticket.ticket_status === 'in_progress' && (
                  <Button
                    variant="outlined" size="small"
                    onClick={() => setNoteDialog({ open: true, mode: 'struggling' })}
                    startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>flag</span>}
                    sx={{ fontSize: 12, color: '#8b5e6a', borderColor: 'rgba(139,94,106,0.4)' }}
                  >
                    Flag as Struggling
                  </Button>
                )}
                <Button
                  variant="outlined" size="small" color="success"
                  onClick={() => setNoteDialog({ open: true, mode: 'resolved' })}
                  startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>}
                  sx={{ fontSize: 12 }}
                >
                  Resolve
                </Button>
              </Box>
            </Card>
          )}

          {/* Actions — Reopen (TLA-assignee, Manager, Admin on resolved/closed) */}
          {canReopen && (
            <Card sx={{ p: 2.5, mb: 2, bgcolor: PAPER, border: '1px solid rgba(196,154,74,0.35)' }}>
              <Typography sx={{
                fontSize: 11, color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1,
              }}>
                Actions
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: TEXT_DIM, mb: 1.5, lineHeight: 1.5 }}>
                This ticket is {isClosed ? 'closed' : 'resolved'}. You can reopen it if the issue has recurred or the resolution was incomplete.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setNoteDialog({ open: true, mode: 'reopen' })}
                startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>restart_alt</span>}
                sx={{
                  fontSize: 12, fontWeight: 700,
                  bgcolor: '#c49a4a', color: '#0a1628',
                  '&:hover': { bgcolor: '#b88a3a' },
                }}
              >
                Reopen ticket
              </Button>
            </Card>
          )}

          {/* Activity / comments — local-only for now */}
          <Card sx={{ p: 3, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
            <Typography sx={{
              fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 2,
            }}>
              Activity ({comments.length})
            </Typography>

            {comments.length === 0 ? (
              <Typography sx={{ color: TEXT_DIM, fontSize: 13, mb: 2 }}>No replies yet.</Typography>
            ) : (
              comments.map(c => <CommentBubble key={c.id} comment={c} />)
            )}

            <Divider sx={{ borderColor: BORDER, mb: 2 }} />

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Avatar sx={{
                width: 32, height: 32, fontSize: 11, fontWeight: 700, flexShrink: 0,
                bgcolor: `${ROLE_ACCENT[user?.role] ?? '#5a8dc4'}22`,
                color: ROLE_ACCENT[user?.role] ?? '#5a8dc4',
              }}>
                {getInitials(user?.name)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth multiline rows={3}
                  placeholder="Add a reply or update…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained" size="small"
                  disabled={!reply.trim() || sending}
                  onClick={handleSendReply}
                  endIcon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>}
                >
                  Send reply
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: '0 0 260px' }}>
          <Card sx={{ p: 2.5, bgcolor: PAPER, border: `1px solid ${BORDER}` }}>
            <Typography sx={{
              fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5,
            }}>
              Ticket info
            </Typography>

            <InfoRow label="Status">
              <Chip label={sLabel} size="small" sx={{
                fontSize: 11, fontWeight: 700, height: 22,
                bgcolor: `${sColor}20`, color: sColor, border: `1px solid ${sColor}44`,
              }} />
            </InfoRow>
            <InfoRow label="Priority">
              <Chip label={pLabel} size="small" sx={{
                fontSize: 11, fontWeight: 700, height: 22,
                bgcolor: `${pColor}20`, color: pColor, border: `1px solid ${pColor}44`,
              }} />
            </InfoRow>
            <InfoRow label="Category">
              <Typography sx={{ fontSize: 12.5, color: TEXT_BRIGHT, fontWeight: 600 }}>
                {ticket.category_name ?? ticket.category_id ?? '—'}
              </Typography>
            </InfoRow>
            <InfoRow label="Department">
              <Typography sx={{
                fontSize: 12.5, fontWeight: 600,
                color: ticket.department_id ? TEXT_BRIGHT : '#c49a4a',
              }}>
                {ticket.department_name ?? (ticket.department_id ? String(ticket.department_id) : 'Unrouted')}
              </Typography>
            </InfoRow>
            <InfoRow label="Submitted">
              <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{timeAgo(ticket.ticket_created_at)}</Typography>
            </InfoRow>
            <InfoRow label="Updated">
              <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>{timeAgo(ticket.ticket_updated_at)}</Typography>
            </InfoRow>
            <InfoRow label="Escalated">
              <Typography sx={{
                fontSize: 12, fontWeight: 600,
                color: ticket.ticket_escalated ? '#8b5e6a' : TEXT_BRIGHT,
              }}>
                {ticket.ticket_escalated ? 'Yes' : 'No'}
              </Typography>
            </InfoRow>

            <Divider sx={{ borderColor: BORDER, my: 1.5 }} />

            <Typography sx={{
              fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5,
            }}>
              People
            </Typography>

            <InfoRow label="Requester">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(148,163,184,0.15)', color: TEXT_DIM }}>
                  {getInitials(ticket.user_name ?? '?')}
                </Avatar>
                <Typography sx={{ fontSize: 12, color: TEXT_BRIGHT }}>
                  {ticket.user_name ?? ticket.user_id ?? '—'}
                </Typography>
              </Box>
            </InfoRow>

            <InfoRow label="Assigned to">
              {assigneeDisplay ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 700, bgcolor: 'rgba(90,141,196,0.20)', color: '#5a8dc4' }}>
                    {assigneeName ? getInitials(assigneeName) : '?'}
                  </Avatar>
                  <Typography sx={{ fontSize: 12, color: '#5a8dc4', fontWeight: 600 }} title={assigneeDisplay}>
                    {assigneeFirst ?? assigneeDisplay}
                    {isAssignedToMe && <span style={{ color: TEXT_MUTED, fontSize: 11, marginLeft: 6 }}>(you)</span>}
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: 12, color: '#c49a4a', fontWeight: 500 }}>Unassigned</Typography>
              )}
            </InfoRow>
          </Card>
        </Box>
      </Box>

      <NoteDialog
        open={noteDialog.open}
        mode={noteDialog.mode}
        onConfirm={handleNoteConfirm}
        onCancel={() => setNoteDialog({ open: false, mode: null })}
      />

      <HistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        ticketId={id}
      />
    </Box>
  );
}