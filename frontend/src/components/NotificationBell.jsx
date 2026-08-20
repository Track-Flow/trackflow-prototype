import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Badge, Popover, Typography, List, ListItemButton,
  Divider, Button, Slide, Paper,
} from '@mui/material';
import api from '../helpers/api';

const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_MUTED  = '#64748b';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const PAPER       = '#111d2e';
const ACCENT      = '#5a8dc4';

const POLL_MS = 15000; // 15s — frequent enough to feel live, cheap enough to poll

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Toast popup — appears top-right when a new notification lands ───────────
function NotificationToast({ notification, onClose, onOpen }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <Slide direction="left" in={!!notification} mountOnEnter unmountOnExit>
      <Paper
        onClick={() => onOpen(notification)}
        elevation={8}
        sx={{
          position: 'fixed', top: 70, right: 20, zIndex: 2000,
          width: { xs: 'calc(100vw - 40px)', sm: 340 },
          background: PAPER, border: `1px solid ${ACCENT}55`,
          borderRadius: 2, p: 1.75, cursor: 'pointer',
          display: 'flex', gap: 1.25, alignItems: 'flex-start',
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${ACCENT}22`,
          '&:hover': { borderColor: ACCENT },
        }}
      >
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${ACCENT}22`, color: ACCENT,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>notifications</span>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: TEXT_BRIGHT, mb: 0.25 }}>
            New notification
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: TEXT_DIM, lineHeight: 1.4 }}>
            {notification.message}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          sx={{ color: TEXT_MUTED, mt: -0.5, mr: -0.5 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </IconButton>
      </Paper>
    </Slide>
  );
}

// ─── Bell + dropdown ───────────────────────────────────────────────────────────
export default function NotificationBell({ inboxPath = '/home/inbox' }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const lastSeenIdRef = useRef(0);
  const initializedRef = useRef(false);

  const open = Boolean(anchorEl);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count ?? 0);
    } catch {
      // silent — polling, don't spam the user with errors
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=20');
      setItems(data);
      if (data.length > 0) {
        lastSeenIdRef.current = Math.max(lastSeenIdRef.current, ...data.map(n => n.notification_id));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for brand-new notifications to drive the toast popup.
  const pollLatest = useCallback(async () => {
    try {
      const { data } = await api.get(`/notifications/latest?sinceId=${lastSeenIdRef.current}`);
      if (data.length > 0) {
        lastSeenIdRef.current = Math.max(...data.map(n => n.notification_id));
        // Show a toast for the newest one only, avoid stacking.
        setToast(data[data.length - 1]);
        setUnreadCount((c) => c + data.length);
      }
    } catch {
      // silent
    }
  }, []);

  // Initial load: establish baseline id from the freshest notification so we
  // don't toast-spam every existing notification on first mount.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/notifications?limit=1');
        if (data.length > 0) lastSeenIdRef.current = data[0].notification_id;
      } catch {
        // fine — baseline stays 0
      } finally {
        initializedRef.current = true;
      }
    })();
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!initializedRef.current) return;
      pollLatest();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [pollLatest]);

  function handleOpen(e) {
    setAnchorEl(e.currentTarget);
    fetchList();
  }

  function handleClose() {
    setAnchorEl(null);
  }

  async function handleItemClick(n) {
    if (!n.is_read) {
      try {
        await api.patch(`/notifications/${n.notification_id}/read`);
        setItems((prev) => prev.map((x) => x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // navigate anyway
      }
    }
    handleClose();
    if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`);
  }

  async function handleMarkAllRead() {
    try {
      await api.patch('/notifications/read-all');
      setItems((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // no-op
    }
  }

  async function handleToastOpen(n) {
    setToast(null);
    if (!n.is_read) {
      try {
        await api.patch(`/notifications/${n.notification_id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // navigate anyway
      }
    }
    if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`);
  }

  function handleViewAll() {
    handleClose();
    navigate(inboxPath);
  }

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_DIM }, display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 15, minWidth: 15, bgcolor: '#c4574a' } }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 19 }}>notifications</span>
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360, maxHeight: 440, mt: 1,
            background: PAPER, border: `1px solid ${BORDER}`,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_BRIGHT }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: 11, color: ACCENT, textTransform: 'none', minWidth: 0, p: 0.5 }}>
              Mark all read
            </Button>
          )}
        </Box>

        <List sx={{ p: 0, maxHeight: 320, overflowY: 'auto' }}>
          {!loading && items.length === 0 && (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: TEXT_MUTED }}>notifications_off</span>
              <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED, mt: 1 }}>You're all caught up</Typography>
            </Box>
          )}

          {items.map((n) => (
            <ListItemButton
              key={n.notification_id}
              onClick={() => handleItemClick(n)}
              sx={{
                px: 2, py: 1.25, alignItems: 'flex-start', gap: 1,
                borderBottom: `1px solid ${BORDER}`,
                background: n.is_read ? 'transparent' : 'rgba(90,141,196,0.06)',
                '&:hover': { background: 'rgba(255,255,255,0.03)' },
              }}
            >
              {!n.is_read && (
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ACCENT, mt: 0.75, flexShrink: 0 }} />
              )}
              {n.is_read && <Box sx={{ width: 6, flexShrink: 0 }} />}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, color: n.is_read ? TEXT_DIM : TEXT_BRIGHT, lineHeight: 1.45 }}>
                  {n.message}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED, mt: 0.4 }}>
                  {timeAgo(n.created_at)}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ borderColor: BORDER }} />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth size="small" onClick={handleViewAll}
            sx={{ fontSize: 12, color: TEXT_DIM, textTransform: 'none', '&:hover': { color: ACCENT } }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>

      <NotificationToast notification={toast} onClose={() => setToast(null)} onOpen={handleToastOpen} />
    </>
  );
}