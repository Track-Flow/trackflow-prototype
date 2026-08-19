import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import tfTheme      from './theme/tfTheme';
import Shell        from './components/Shell';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TLAHome      from './pages/TLAHome';
import ManagerHome  from './pages/ManagerHome';
import EndUserHome  from './pages/EndUserHome';
import HelpdeskHome from './pages/HelpdeskHome';
import AccessManagement from './pages/AccessManagement';
import Stub         from './pages/Stub';
import SubmitTicket  from './pages/SubmitTicket';
import TicketDetail  from './pages/TicketDetail';
import MyTickets     from './pages/MyTickets';
import TLABoard from './pages/TLABoard';
import MyQueue from './pages/MyQueue';
import ManagerReports from './pages/ManagerReports';
import ManagerAllTickets from './pages/ManagerAlltickets';
import Profile from './pages/Profile';
// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getUser() {
  try { return JSON.parse(localStorage.getItem('tf_user')); }
  catch { return null; }
}

const ROLE_HOME = {
  tla:         '/tla',
  mss_manager: '/manager',
  end_user:    '/home',
  admin:       '/helpdesk',
};

// ─── Guards ───────────────────────────────────────────────────────────────────

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem('tf_token');
  const user  = getUser();
  if (!token || !user)                      return <Navigate to="/login"  replace />;
  if (roles && !roles.includes(user.role))  return <Navigate to="/"      replace />;
  return <Shell>{children}</Shell>;
}

function RoleRedirect() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider theme={tfTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* TLA */}
          <Route path="/tla"       element={<PrivateRoute roles={['tla']}><TLAHome /></PrivateRoute>} />
          <Route path="/tla/board" element={<PrivateRoute roles={['tla']}><TLABoard /></PrivateRoute>} />
          <Route path="/tla/queue" element={<PrivateRoute roles={['tla']}><MyQueue /></PrivateRoute>} />
          <Route path="/tla/inbox" element={<PrivateRoute roles={['tla']}><Stub title="Inbox" icon="inbox" /></PrivateRoute>} />
          <Route path="/tla/profile" element={<PrivateRoute roles={['tla']}><Profile /></PrivateRoute>} />



          {/* MSS Manager */}
          <Route path="/manager"         element={<PrivateRoute roles={['mss_manager']}><ManagerHome /></PrivateRoute>} />
          <Route path="/manager/tickets" element={<PrivateRoute roles={['mss_manager']}><ManagerAllTickets/></PrivateRoute>} />
          <Route path="/manager/depts"   element={<PrivateRoute roles={['mss_manager']}><Stub title="Departments" icon="groups" /></PrivateRoute>} />
          <Route path="/manager/reports" element={<PrivateRoute roles={['mss_manager']}><ManagerReports /></PrivateRoute>} />
          <Route path="/manager/tlas"    element={<PrivateRoute roles={['mss_manager']}><Stub title="TLAs" icon="badge" /></PrivateRoute>} />
          <Route path="/manager/profile" element={<PrivateRoute roles={['mss_manager']}><Profile /></PrivateRoute>} />

          {/* End User */}
          <Route path="/home"         element={<PrivateRoute roles={['end_user']}><EndUserHome /></PrivateRoute>} />
          <Route path="/submit" element={<PrivateRoute roles={['end_user']}><SubmitTicket /></PrivateRoute>} />
          <Route path="/home/tickets" element={<PrivateRoute roles={['end_user']}><MyTickets /></PrivateRoute>} />
          <Route path="/home/inbox"   element={<PrivateRoute roles={['end_user']}><Stub title="Notifications" icon="notifications" /></PrivateRoute>} />
          <Route path="/home/profile" element={<PrivateRoute roles={['end_user']}><Profile /></PrivateRoute>} />
          <Route path="/tickets/:id" element={<PrivateRoute roles={['tla','mss_manager','end_user','admin']}><TicketDetail /></PrivateRoute>} />


          {/* Help Desk */}
          <Route path="/helpdesk"         element={<PrivateRoute roles={['admin']}><HelpdeskHome /></PrivateRoute>} />
          <Route path="/helpdesk/tickets" element={<PrivateRoute roles={['admin']}><Stub title="All tickets" icon="confirmation_number" /></PrivateRoute>} />
          <Route path="/helpdesk/users" element={<PrivateRoute roles={['admin']}><AccessManagement /></PrivateRoute>} />

          <Route path="/helpdesk/cats"    element={<PrivateRoute roles={['admin']}><Stub title="Categories" icon="category" /></PrivateRoute>} />
          <Route path="/helpdesk/audit"   element={<PrivateRoute roles={['admin']}><Stub title="Audit log" icon="shield" /></PrivateRoute>} />
          <Route path="/helpdesk/profile" element={<PrivateRoute roles={['admin']}><Profile /></PrivateRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}