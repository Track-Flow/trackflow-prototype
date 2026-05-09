import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import tfTheme from './theme/tfTheme';
import Shell, { getActiveRole, setActiveRole, ROLE_HOME } from './components/Shell';

import EndUserHome     from './pages/EndUserHome';
import SubmitTicket    from './pages/SubmitTicket';
import MyTickets       from './pages/MyTickets';
import TicketDetail    from './pages/TicketDetail';
import TLAHome         from './pages/TLAHome';
import TLABoard        from './pages/TLABoard';
import ManagerHome     from './pages/ManagerHome';
import ManagerReports  from './pages/ManagerReports';
import HelpdeskHome    from './pages/HelpdeskHome';
import AccessManagement from './pages/AccessManagement';

// ─── Stub for unbuilt pages ───────────────────────────────────────────────────

import { Box, Typography } from '@mui/material';
function Stub({ title, icon = 'construction' }) {
  return (
    <Box sx={{ textAlign: 'center', pt: 8 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#3a4f6a', display: 'block', marginBottom: 16 }}>
        {icon}
      </span>
      <Typography variant="h5" sx={{ color: '#e6edf7', mb: 1 }}>{title}</Typography>
      <Typography sx={{ color: '#8fa2c0', fontSize: 13 }}>This page is not included in the prototype.</Typography>
    </Box>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [role, setRole]                 = useState(getActiveRole());
  const [extraTickets, setExtraTickets] = useState([]);

  function handleRoleSwitch(newRole) {
    setActiveRole(newRole);
    setRole(newRole);
  }

  function addTicket(ticket) {
    setExtraTickets(prev => [ticket, ...prev]);
  }

  function wrap(children) {
    return (
      <Shell role={role} onRoleSwitch={handleRoleSwitch}>
        {children}
      </Shell>
    );
  }

  return (
    <ThemeProvider theme={tfTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Root → role home */}
          <Route path="/" element={<Navigate to={ROLE_HOME[role] ?? '/home'} replace />} />

          {/* ── End User ── */}
          <Route path="/home"         element={wrap(<EndUserHome extraTickets={extraTickets} />)} />
          <Route path="/submit"       element={wrap(<SubmitTicket onSubmit={addTicket} />)} />
          <Route path="/home/tickets" element={wrap(<MyTickets extraTickets={extraTickets} />)} />
          <Route path="/home/inbox"   element={wrap(<Stub title="Notifications" icon="notifications" />)} />
          <Route path="/home/profile" element={wrap(<Stub title="Profile" icon="person" />)} />

          {/* ── Shared ── */}
          <Route path="/tickets/:id"  element={wrap(<TicketDetail extraTickets={extraTickets} />)} />

          {/* ── TLA ── */}
          <Route path="/tla"          element={wrap(<TLAHome extraTickets={extraTickets} />)} />
          <Route path="/tla/board"    element={wrap(<TLABoard extraTickets={extraTickets} />)} />
          <Route path="/tla/inbox"    element={wrap(<Stub title="Inbox" icon="inbox" />)} />

          {/* ── MSS Manager ── */}
          <Route path="/manager"         element={wrap(<ManagerHome extraTickets={extraTickets} />)} />
          <Route path="/manager/reports" element={wrap(<ManagerReports />)} />
          <Route path="/manager/tickets" element={wrap(<Stub title="All Tickets" icon="confirmation_number" />)} />
          <Route path="/manager/tlas"    element={wrap(<Stub title="TLA Management" icon="badge" />)} />

          {/* ── Help Desk ── */}
          <Route path="/helpdesk"         element={wrap(<HelpdeskHome extraTickets={extraTickets} />)} />
          <Route path="/helpdesk/users"   element={wrap(<AccessManagement />)} />
          <Route path="/helpdesk/tickets" element={wrap(<Stub title="All Tickets" icon="confirmation_number" />)} />
          <Route path="/helpdesk/audit"   element={wrap(<Stub title="Audit Log" icon="shield" />)} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={ROLE_HOME[role] ?? '/home'} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}