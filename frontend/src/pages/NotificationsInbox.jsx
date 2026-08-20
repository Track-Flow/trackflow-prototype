import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Button, CircularProgress, Alert,
  Checkbox, Tooltip, IconButton, useTheme, useMediaQuery,
} from '@mui/material';
import api from '../helpers/api';

const ACCENT      = '#5a8dc4';
const PAPER       = '#111d2e';
const PAPER2      = '#0c1422';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_DIM    = '#94a3b8';
const TEXT_MUTED  = '#64748b';
const TEXT_BRIGHT = '#e3e8f0';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'now';
  if (mins  < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days  < 7)  return `${days}d`;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
}

// Derive a short "sender"-style label + icon from the notification content,
// since notifications don't have a real sender — the ticket lifecycle is
// the closest analogue to who/what this is "from".
function classify(n) {
  const msg = n.message.toLowerCase();
  if (msg.includes('resolved'))          return { label: 'Resolved',      icon: 'check_circle', color: '#5a8f72' };
  if (msg.includes('struggling'))        return { label: 'Struggling',    icon: 'flag',          color: '#7a6fa8' };
  if (msg.includes('reopened'))          return { label: 'Reopened',      icon: 'restart_alt',   color: '#c49a4a' };
  if (msg.includes('assigned'))          return { label: 'Assignment',    icon: 'person_add',    color: ACCENT    };
  if (msg.includes('submitted'))         return { label: 'Submitted',     icon: 'send',           color: ACCENT    };
  if (msg.includes('closed'))            return { label: 'Closed',        icon: 'lock',           color: '#475569' };
  if (msg.includes('flagged for reassignment')) return { label: 'Reassignment', icon: 'alt_route', color: '#8b5e6a' };
  return { label: 'Update', icon: 'notifications', color: TEXT_MUTED };
}

// ─── Table header ─────────────────────────────────────────────────────────────
function TableHeader({ allSelected, someSelected, onSelectAll, dense }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: dense ? '36px 1fr 60px' : '36px 120px 1fr 90px',
      alignItems: 'center', gap: 1.5, px: 2, py: 1,
      borderBottom: `1px solid ${BORDER}`, bgcolor: PAPER2,
    }}>
      <Checkbox
        size="small"
        checked={allSelected}
        indeterminate={someSelected && !allSelected}
        onChange={onSelectAll}
        sx={{ p: 0.5, color: TEXT_MUTED, '&.Mui-checked': { color: ACCENT }, '&.MuiCheckbox-indeterminate': { color: ACCENT } }}
      />
      {!dense && (
        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Type
        </Typography>
      )}
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
        Message
      </Typography>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: 'right' }}>
        When
      </Typography>
    </Box>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ n, selected, onToggleSelect, onOpen, onDelete, dense }) {
  const meta = classify(n);
  const unread = !n.is_read;

  return (
    <Box
      onClick={() => onOpen(n)}
      sx={{
        display: 'grid',
        gridTemplateColumns: dense ? '36px 1fr 60px' : '36px 120px 1fr 90px',
        alignItems: 'center', gap: 1.5, px: 2, py: 1.15,
        borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
        bgcolor: unread ? 'rgba(90,141,196,0.045)' : 'transparent',
        position: 'relative',
        '&:hover': { bgcolor: unread ? 'rgba(90,141,196,0.08)' : 'rgba(255,255,255,0.03)' },
        '&:hover .row-delete': { opacity: 1 },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Checkbox
        size="small"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(n.notification_id)}
        sx={{ p: 0.5, color: TEXT_MUTED, '&.Mui-checked': { color: ACCENT } }}
      />

      {!dense && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: `${meta.color}1f`, color: meta.color,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{meta.icon}</span>
          </Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: unread ? 700 : 500, color: unread ? meta.color : TEXT_MUTED }} noWrap>
            {meta.label}
          </Typography>
        </Box>
      )}

      <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        {unread && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ACCENT, flexShrink: 0 }} />}
        {dense && (
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: meta.color, flexShrink: 0 }}>{meta.icon}</span>
        )}
        <Typography
          sx={{
            fontSize: 13, lineHeight: 1.4, minWidth: 0,
            fontWeight: unread ? 600 : 400,
            color: unread ? TEXT_BRIGHT : TEXT_DIM,
          }}
          noWrap
        >
          {n.message}
        </Typography>
        {n.ticket_id && (
          <Typography sx={{ fontSize: 11, color: TEXT_MUTED, flexShrink: 0, display: { xs: 'none', sm: 'inline' } }}>
            · #{n.ticket_id}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
        <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED, whiteSpace: 'nowrap' }}>
          {timeAgo(n.created_at)}
        </Typography>
        <Tooltip title="Delete" arrow>
          <IconButton
            size="small"
            className="row-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(n); }}
            sx={{ opacity: 0, transition: 'opacity 0.1s', color: TEXT_MUTED, p: 0.4, '&:hover': { color: '#ff6b6b' } }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: TEXT_MUTED }}>
        {filter === 'unread' ? 'mark_email_read' : 'inbox'}
      </span>
      <Typography sx={{ color: TEXT_BRIGHT, fontWeight: 600, mt: 1.5, fontSize: 14 }}>
        {filter === 'unread' ? 'No unread messages' : 'Inbox is empty'}
      </Typography>
      <Typography sx={{ color: TEXT_MUTED, fontSize: 12.5, mt: 0.5 }}>
        {filter === 'unread' ? "You're all caught up." : "Updates on your tickets will show up here."}
      </Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NotificationsInbox() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const dense    = useMediaQuery(theme.breakpoints.down('sm'));

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all'); // all | unread
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/notifications?limit=100${filter === 'unread' ? '&unread=true' : ''}`);
      setItems(data);
      setSelected(new Set());
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const allSelected  = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((n) => n.notification_id)));
  }

  async function openNotification(n) {
    if (!n.is_read) {
      try {
        await api.patch(`/notifications/${n.notification_id}/read`);
        setItems((prev) => prev.map((x) => x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x));
      } catch {
        // navigate anyway
      }
    }
    if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`);
  }

  async function deleteOne(n) {
    try {
      await api.delete(`/notifications/${n.notification_id}`);
      setItems((prev) => prev.filter((x) => x.notification_id !== n.notification_id));
      setSelected((prev) => { const next = new Set(prev); next.delete(n.notification_id); return next; });
    } catch {
      // no-op
    }
  }

  async function deleteSelected() {
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => api.delete(`/notifications/${id}`)));
      setItems((prev) => prev.filter((x) => !selected.has(x.notification_id)));
      setSelected(new Set());
    } catch {
      // no-op
    }
  }

  async function markSelectedRead() {
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`)));
      setItems((prev) => prev.map((x) => selected.has(x.notification_id) ? { ...x, is_read: 1 } : x));
      setSelected(new Set());
    } catch {
      // no-op
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      setItems((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
    } catch {
      // no-op
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: TEXT_BRIGHT, fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>
            Inbox
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Toolbar */}
      <Card sx={{ bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1, borderBottom: `1px solid ${BORDER}`, gap: 1, flexWrap: 'wrap',
        }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[{ key: 'all', label: 'All' }, { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` }].map((f) => (
              <Button
                key={f.key} size="small" onClick={() => setFilter(f.key)}
                sx={{
                  fontSize: 12, py: 0.4, px: 1.25, borderRadius: 1.5, textTransform: 'none',
                  fontWeight: filter === f.key ? 700 : 400,
                  color: filter === f.key ? ACCENT : TEXT_MUTED,
                  bgcolor: filter === f.key ? `${ACCENT}18` : 'transparent',
                  '&:hover': { bgcolor: filter === f.key ? `${ACCENT}22` : 'rgba(255,255,255,0.04)' },
                }}
              >
                {f.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {someSelected ? (
              <>
                <Button size="small" onClick={markSelectedRead} sx={{ fontSize: 12, color: TEXT_DIM, textTransform: 'none' }}>
                  Mark read ({selected.size})
                </Button>
                <Button size="small" onClick={deleteSelected} sx={{ fontSize: 12, color: '#ff6b6b', textTransform: 'none' }}>
                  Delete
                </Button>
              </>
            ) : (
              unreadCount > 0 && (
                <Button size="small" onClick={markAllRead} sx={{ fontSize: 12, color: ACCENT, textTransform: 'none' }}>
                  Mark all read
                </Button>
              )
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={22} sx={{ color: ACCENT }} />
          </Box>
        ) : items.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            <TableHeader
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={toggleSelectAll}
              dense={dense}
            />
            <Box sx={{ maxHeight: 560, overflowY: 'auto' }}>
              {items.map((n) => (
                <Row
                  key={n.notification_id}
                  n={n}
                  dense={dense}
                  selected={selected.has(n.notification_id)}
                  onToggleSelect={toggleSelect}
                  onOpen={openNotification}
                  onDelete={deleteOne}
                />
              ))}
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
}