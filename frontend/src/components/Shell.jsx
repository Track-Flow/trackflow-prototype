import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Divider, Tooltip,
  useMediaQuery, useTheme,
} from '@mui/material';

export const DRAWER_W = 240;
export const TOPBAR_H = 56;

const BG_SIDEBAR  = '#0a1120';
const BG_MAIN     = '#0c1422';
const BG_TOPBAR   = '#0e1828';
const BORDER      = 'rgba(148,163,184,0.10)';
const TEXT_MUTED  = '#64748b';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';

const ROLE_ACCENT = {
  tla:         '#5a8dc4',
  mss_manager: '#7a6fa8',
  end_user:    '#5a8dc4',
  admin:       '#c49a4a',
};

export const STATUS_COLORS = {
  open:        '#5a8dc4',
  in_progress: '#c49a4a',
  struggling:  '#7a6fa8',
  resolved:    '#5a8f72',
  closed:      '#475569',
  unrouted:    '#8b5e6a',
};

export const ROLE_HOME = {
  end_user:    '/home',
  tla:         '/tla',
  mss_manager: '/manager',
  admin:       '/helpdesk',
};

const NAV = {
  tla: [
    { group: 'Workspace' },
    { icon: 'dashboard',           label: 'Dashboard', path: '/tla'       },
    { icon: 'view_kanban',         label: 'Board',     path: '/tla/board' },
    { icon: 'confirmation_number', label: 'My queue',  path: '/tla/queue' },
    { group: 'Account' },
    { icon: 'inbox',               label: 'Inbox',     path: '/tla/inbox' },
  ],
  mss_manager: [
    { group: 'Operations' },
    { icon: 'dashboard',           label: 'Overview',        path: '/manager'         },
    { icon: 'confirmation_number', label: 'All tickets',     path: '/manager/tickets' },
    { icon: 'groups',              label: 'Departments',     path: '/manager/depts'   },
    { icon: 'analytics',           label: 'Reports',         path: '/manager/reports' },
    { icon: 'download',            label: 'Export Reports',  path: '/manager/exports' },
    { group: 'Team' },
    { icon: 'badge',               label: 'TLAs',            path: '/manager/tlas'    },
  ],
  end_user: [
    { group: 'Support' },
    { icon: 'home',                label: 'Home',          path: '/home'         },
    { icon: 'add_circle',          label: 'Submit ticket', path: '/submit'       },
    { icon: 'confirmation_number', label: 'My tickets',    path: '/home/tickets' },
    { group: 'Account' },
    { icon: 'notifications',       label: 'Notifications', path: '/home/inbox'   },
    { icon: 'person',              label: 'Profile',       path: '/home/profile' },
  ],
  admin: [
    { group: 'Help Desk' },
    { icon: 'alt_route',           label: 'Unrouted queue', path: '/helpdesk'         },
    { icon: 'confirmation_number', label: 'All tickets',    path: '/helpdesk/tickets' },
    { icon: 'manage_accounts',     label: 'User access',    path: '/helpdesk/users'   },
    { group: 'Config' },
    { icon: 'category',            label: 'Categories',     path: '/helpdesk/cats'    },
    { icon: 'shield',              label: 'Audit log',      path: '/helpdesk/audit'   },
  ],
};

const PAGE_TITLES = {
  '/home': 'Home', '/submit': 'Submit ticket', '/home/tickets': 'My tickets',
  '/home/inbox': 'Notifications', '/home/profile': 'Profile',
  '/tla': 'Dashboard', '/tla/board': 'Board', '/tla/queue': 'My queue', '/tla/inbox': 'Inbox',
  '/manager': 'Overview', '/manager/tickets': 'All tickets', '/manager/depts': 'Departments',
  '/manager/reports': 'Reports', '/manager/exports': 'Export Reports', '/manager/tlas': 'TLAs',
  '/helpdesk': 'Unrouted queue', '/helpdesk/tickets': 'All tickets',
  '/helpdesk/users': 'User access', '/helpdesk/cats': 'Categories', '/helpdesk/audit': 'Audit log',
};

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function TFLogo({ accent }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, py: 2 }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '6px',
        background: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#fff', fontVariationSettings: "'FILL' 1" }}>
          confirmation_number
        </span>
      </Box>
      <Box>
        <Typography sx={{ fontFamily: '"Rubik", sans-serif', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', lineHeight: 1, color: TEXT_BRIGHT }}>
          <span style={{ color: accent }}>TRACK</span>FLOW
        </Typography>
        <Typography sx={{ fontSize: 9, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.25 }}>
          Wits University · MSS
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ role, accent, user, onNavClick, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = NAV[role] ?? [];

  function go(path) {
    navigate(path);
    if (onNavClick) onNavClick();
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG_SIDEBAR }}>
      <TFLogo accent={accent} />
      <Divider sx={{ borderColor: BORDER, mx: 2 }} />

      <Box sx={{ px: 2, py: 1.25 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.25, py: 0.75, borderRadius: 1,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${BORDER}`, cursor: 'text',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: TEXT_MUTED }}>search</span>
          <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>Search tickets…</Typography>
        </Box>
      </Box>

      <List sx={{ flex: 1, px: 1.25, py: 0, overflowY: 'auto' }}>
        {navItems.map((item, i) => {
          if (item.group) {
            return (
              <Typography key={i} sx={{
                fontSize: 9, fontWeight: 700, color: TEXT_MUTED,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                px: 1, pt: i === 0 ? 0.5 : 1.75, pb: 0.5,
              }}>
                {item.group}
              </Typography>
            );
          }
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.15 }}>
              <ListItemButton
                onClick={() => go(item.path)}
                sx={{
                  borderRadius: 1, py: 0.7, px: 1,
                  background: active ? `${accent}18` : 'transparent',
                  '&:hover': { background: active ? `${accent}22` : 'rgba(255,255,255,0.04)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: 17, color: active ? accent : TEXT_MUTED,
                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                  }}>{item.icon}</span>
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? TEXT_BRIGHT : TEXT_DIM,
                }} />
                {active && <Box sx={{ width: 2.5, height: 14, borderRadius: 1, bgcolor: accent }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: BORDER, mx: 2 }} />
      <Box sx={{ p: 1.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: `${accent}22`, color: accent, flexShrink: 0 }}>
          {getInitials(user?.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>{user?.name ?? 'User'}</Typography>
          <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED, textTransform: 'capitalize' }} noWrap>
            {role?.replace('_', ' ')}
          </Typography>
        </Box>
        <Tooltip title="Sign out" arrow>
          <IconButton size="small" onClick={onLogout} sx={{ color: TEXT_MUTED, '&:hover': { color: '#ff6b6b' } }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>logout</span>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ title, onMenuOpen }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="sticky" elevation={0} sx={{
      background: BG_TOPBAR,
      borderBottom: `1px solid ${BORDER}`,
      height: TOPBAR_H,
    }}>
      <Toolbar sx={{ minHeight: `${TOPBAR_H}px !important`, gap: 1.5 }}>

        {isMobile && (
          <IconButton size="small" onClick={onMenuOpen} sx={{ color: TEXT_DIM, mr: 0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
          </IconButton>
        )}

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {!isMobile && (
            <>
              <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>Workspace</Typography>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: TEXT_MUTED }}>chevron_right</span>
            </>
          )}
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>{title}</Typography>
        </Box>

       

        <IconButton size="small" sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_DIM }, display: { xs: 'none', sm: 'inline-flex' } }}>
          <span className="material-symbols-outlined" style={{ fontSize: 19 }}>notifications</span>
        </IconButton>
        <IconButton size="small" sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_DIM }, display: { xs: 'none', sm: 'inline-flex' } }}>
          <span className="material-symbols-outlined" style={{ fontSize: 19 }}>help</span>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function Shell({ children }) {
  const location    = useLocation();
  const navigate    = useNavigate();
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const user   = JSON.parse(localStorage.getItem('tf_user') ?? 'null');
  const role   = user?.role ?? 'end_user';
  const accent = ROLE_ACCENT[role] ?? '#5a8dc4';
  const title  = PAGE_TITLES[location.pathname] ?? 'TrackFlow';

  const handleLogout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    navigate('/login');
  };

  const drawerProps = {
    sx: {
      width: DRAWER_W, flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_W,
        border: 'none',
        borderRight: `1px solid ${BORDER}`,
      },
    },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: BG_MAIN }}>

      {!isMobile && (
        <Drawer variant="permanent" {...drawerProps}>
          <SidebarContent role={role} accent={accent} user={user} onLogout={handleLogout} />
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          {...drawerProps}
        >
          <SidebarContent
            role={role} accent={accent} user={user}
            onNavClick={() => setOpen(false)}
            onLogout={handleLogout}
          />
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={title} onMenuOpen={() => setOpen(true)} />
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}