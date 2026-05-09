import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Divider, Menu, MenuItem,
  useMediaQuery, useTheme,
} from '@mui/material';
import { ROLE_PERSONAS, tfUsers } from '../data/mockData';

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
  tla:            '#5a8dc4',
  mss_manager:    '#7a6fa8',
  end_user:       '#5a8dc4',
  helpdesk_admin: '#c49a4a',
};

export const STATUS_COLORS = {
  open:        '#5a8dc4',
  in_progress: '#c49a4a',
  pending:     '#7a6fa8',
  resolved:    '#5a8f72',
  closed:      '#475569',
  unrouted:    '#8b5e6a',
};

export const ROLE_HOME = {
  end_user:       '/home',
  tla:            '/tla',
  mss_manager:    '/manager',
  helpdesk_admin: '/helpdesk',
};

const NAV = {
  tla: [
    { group: 'Workspace' },
    { icon: 'dashboard',           label: 'Dashboard', path: '/tla'       },
    { icon: 'view_kanban',         label: 'Board',     path: '/tla/board' },
    { group: 'Account' },
    { icon: 'inbox',               label: 'Inbox',     path: '/tla/inbox' },
  ],
  mss_manager: [
    { group: 'Operations' },
    { icon: 'dashboard',           label: 'Overview',    path: '/manager'         },
    { icon: 'confirmation_number', label: 'All tickets', path: '/manager/tickets' },
    { icon: 'analytics',           label: 'Reports',     path: '/manager/reports' },
    { group: 'Team' },
    { icon: 'badge',               label: 'TLAs',        path: '/manager/tlas'    },
  ],
  end_user: [
    { group: 'Support' },
    { icon: 'home',                label: 'Home',          path: '/home'         },
    { icon: 'add_circle',          label: 'Submit ticket', path: '/submit'       },
    { icon: 'confirmation_number', label: 'My tickets',    path: '/home/tickets' },
    { group: 'Account' },
    { icon: 'notifications',       label: 'Notifications', path: '/home/inbox'   },
    { icon: 'person',              label: 'Profile',       path: '/home/profile'  },
  ],
  helpdesk_admin: [
    { group: 'Help Desk' },
    { icon: 'alt_route',           label: 'Unrouted queue', path: '/helpdesk'         },
    { icon: 'confirmation_number', label: 'All tickets',    path: '/helpdesk/tickets' },
    { group: 'Config' },
    { icon: 'manage_accounts',     label: 'User access',    path: '/helpdesk/users'   },
    { icon: 'shield',              label: 'Audit log',      path: '/helpdesk/audit'   },
  ],
};

const PAGE_TITLES = {
  '/home': 'Home', '/submit': 'Submit ticket', '/home/tickets': 'My tickets',
  '/home/inbox': 'Notifications', '/home/profile': 'Profile',
  '/tla': 'Dashboard', '/tla/board': 'Board', '/tla/inbox': 'Inbox',
  '/manager': 'Overview', '/manager/tickets': 'All tickets',
  '/manager/reports': 'Reports', '/manager/tlas': 'TLAs',
  '/helpdesk': 'Unrouted queue', '/helpdesk/tickets': 'All tickets',
  '/helpdesk/users': 'User access', '/helpdesk/audit': 'Audit log',
};

export function getActiveRole() {
  return sessionStorage.getItem('tf_proto_role') ?? 'end_user';
}
export function setActiveRole(role) {
  sessionStorage.setItem('tf_proto_role', role);
}
export function getActiveUser() {
  const role    = getActiveRole();
  const persona = ROLE_PERSONAS.find(p => p.role === role);
  return tfUsers.find(u => u.id === persona?.userId) ?? tfUsers[8];
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

// ─── Role toggle ──────────────────────────────────────────────────────────────

function RoleToggle({ currentRole, onSwitch }) {
  const [anchor, setAnchor] = useState(null);
  const persona  = ROLE_PERSONAS.find(p => p.role === currentRole);
  const accent   = ROLE_ACCENT[currentRole] ?? '#5a8dc4';
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Box
        onClick={e => setAnchor(e.currentTarget)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          px: 1.25, py: 0.6, borderRadius: 1, cursor: 'pointer',
          border: `1px solid ${BORDER}`,
          background: '#0e1828',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: `${accent}60` },
        }}
      >
        {!isMobile && (
          <Box>
            <Typography sx={{ fontSize: 9, color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.3 }}>
              Viewing as
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: accent, lineHeight: 1.3 }}>
              {persona?.label ?? 'End User'}
            </Typography>
          </Box>
        )}
        {isMobile && (
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: accent }}>
            {persona?.label ?? 'End User'}
          </Typography>
        )}
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: TEXT_MUTED }}>unfold_more</span>
      </Box>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{
          sx: {
            background: '#111d2e',
            border: `1px solid ${BORDER}`,
            borderRadius: 1.5, mt: 1, minWidth: 210,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          },
        }}
      >
        <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
          Switch persona
        </Typography>
        {ROLE_PERSONAS.map(p => {
          const user     = tfUsers.find(u => u.id === p.userId);
          const isActive = p.role === currentRole;
          const ac       = ROLE_ACCENT[p.role] ?? '#5a8dc4';
          return (
            <MenuItem
              key={p.role}
              onClick={() => { onSwitch(p.role); setAnchor(null); }}
              sx={{
                gap: 1.5, py: 1, mx: 1, mb: 0.25, borderRadius: 1,
                background: isActive ? `${ac}18` : 'transparent',
                '&:hover': { background: `${ac}22` },
              }}
            >
              <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: `${ac}20`, color: ac }}>
                {user?.initials}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT }}>{user?.name}</Typography>
                <Typography sx={{ fontSize: 10.5, color: TEXT_DIM }}>{p.label}</Typography>
              </Box>
              {isActive && <span className="material-symbols-outlined" style={{ fontSize: 13, color: ac }}>check</span>}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

// ─── Sidebar content (shared between permanent + temporary drawer) ─────────────

function SidebarContent({ role, accent, user, onNavClick }) {
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
          {user?.initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: TEXT_BRIGHT }} noWrap>{user?.name}</Typography>
          <Typography sx={{ fontSize: 10.5, color: TEXT_MUTED }} noWrap>{user?.sub ?? role}</Typography>
        </Box>
        <IconButton size="small" sx={{ color: TEXT_MUTED, '&:hover': { color: TEXT_DIM } }}>
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>settings</span>
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ title, role, accent, onSwitch, onMenuOpen }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="sticky" elevation={0} sx={{
      background: BG_TOPBAR,
      borderBottom: `1px solid ${BORDER}`,
      height: TOPBAR_H,
    }}>
      <Toolbar sx={{ minHeight: `${TOPBAR_H}px !important`, gap: 1.5 }}>

        {/* Hamburger — mobile only */}
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

        <RoleToggle currentRole={role} onSwitch={onSwitch} />

        {/* Live pill — hidden on xs */}
        <Box sx={{
          display: { xs: 'none', sm: 'inline-flex' }, alignItems: 'center', gap: 0.6,
          px: 1, py: 0.35, borderRadius: 1,
          border: `1px solid rgba(90,143,114,0.25)`,
          background: 'rgba(90,143,114,0.08)',
        }}>
          <Box sx={{
            width: 5, height: 5, borderRadius: '50%', bgcolor: '#5a8f72',
            animation: 'tfpulse 2.5s ease-in-out infinite',
            '@keyframes tfpulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }} />
          <Typography sx={{ fontSize: 10, color: '#5a8f72', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE</Typography>
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

export default function Shell({ children, role, onRoleSwitch }) {
  const location    = useLocation();
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const accent = ROLE_ACCENT[role] ?? '#5a8dc4';
  const user   = getActiveUser();
  const title  = PAGE_TITLES[location.pathname] ?? 'TrackFlow';

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

      {/* Desktop — permanent */}
      {!isMobile && (
        <Drawer variant="permanent" {...drawerProps}>
          <SidebarContent role={role} accent={accent} user={user} />
        </Drawer>
      )}

      {/* Mobile — temporary overlay */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          {...drawerProps}
        >
          <SidebarContent role={role} accent={accent} user={user} onNavClick={() => setOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          title={title} role={role} accent={accent}
          onSwitch={onRoleSwitch}
          onMenuOpen={() => setOpen(true)}
        />
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}