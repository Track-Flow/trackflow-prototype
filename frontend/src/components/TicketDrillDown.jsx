import { useNavigate } from 'react-router-dom';
import {
  Drawer, Box, Typography, IconButton, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Divider,
} from '@mui/material';
import { statusMeta, timeAgo, getResolutionHours, isSlaBreached } from '../helpers/ticketHelpers';

const ACCENT      = '#7a6fa8';
const TEXT_DIM    = '#94a3b8';
const TEXT_BRIGHT = '#e3e8f0';
const BORDER      = 'rgba(148,163,184,0.10)';
const PAPER       = '#111d2e';
const PAPER2      = '#0c1422';

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Shared drill-down drawer for the Reports page.
 * Renders whichever tickets the caller passes in, with optional extra
 * columns (`showSla` for resolution time + breach flag). Row click opens
 * the shared /tickets/:id detail route for any role.
 *
 * Props:
 *   open        bool
 *   onClose     fn
 *   title       string — drawer heading (e.g. "IT Support" or "12 Apr")
 *   subtitle    string — optional secondary line under the title
 *   tickets     array
 *   showSla     bool — adds "Resolution time" + "SLA" columns
 *   slaHours    number — used for breach calc when showSla is true
 */
export default function TicketDrillDown({ open, onClose, title, subtitle, tickets = [], showSla = false, slaHours = 24 }) {
  const navigate = useNavigate();

  const handleRowClick = (ticketId) => {
    onClose?.();
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          bgcolor: PAPER,
          borderLeft: `1px solid ${BORDER}`,
        },
      }}
    >
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${BORDER}`, bgcolor: PAPER2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              Drill-down
            </Typography>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: TEXT_BRIGHT }}>{title}</Typography>
            {subtitle && <Typography sx={{ fontSize: 12, color: TEXT_DIM, mt: 0.25 }}>{subtitle}</Typography>}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: TEXT_DIM }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: 11.5, color: TEXT_DIM, mt: 1 }}>
          {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
        </Typography>
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        {tickets.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13, color: TEXT_DIM }}>No tickets in this slice.</Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket</TableCell>
                <TableCell sx={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</TableCell>
                {showSla && (
                  <>
                    <TableCell sx={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Res. time</TableCell>
                    <TableCell sx={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>SLA</TableCell>
                  </>
                )}
                {!showSla && (
                  <TableCell sx={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, borderColor: BORDER, bgcolor: PAPER2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Updated</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map(t => {
                const s = statusMeta(t.ticket_status);
                const resHours = showSla ? getResolutionHours(t) : null;
                const breached = showSla ? isSlaBreached(t, slaHours) : false;
                return (
                  <TableRow
                    key={t.ticket_id}
                    onClick={() => handleRowClick(t.ticket_id)}
                    sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(122,111,168,0.06)' } }}
                  >
                    <TableCell sx={{ borderColor: BORDER, maxWidth: 220 }}>
                      <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>#{t.ticket_id}</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: TEXT_BRIGHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.ticket_title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: BORDER }}>
                      <Chip label={s.label} size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: `${s.color}20`, color: s.color }} />
                    </TableCell>
                    {showSla ? (
                      <>
                        <TableCell sx={{ fontSize: 11.5, color: TEXT_DIM, borderColor: BORDER, whiteSpace: 'nowrap' }}>
                          {fmtHours(resHours)}
                        </TableCell>
                        <TableCell sx={{ borderColor: BORDER }}>
                          {t.ticket_status === 'resolved' || t.ticket_status === 'closed' || breached ? (
                            <Chip
                              label={breached ? 'Breach' : 'Met'}
                              size="small"
                              sx={{ height: 18, fontSize: 9.5, fontWeight: 700,
                                bgcolor: breached ? 'rgba(184,92,82,0.15)' : 'rgba(90,143,114,0.15)',
                                color: breached ? '#b85c52' : '#5a8f72' }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 11, color: TEXT_DIM }}>Pending</Typography>
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell sx={{ fontSize: 11, color: TEXT_DIM, borderColor: BORDER, whiteSpace: 'nowrap' }}>
                        {timeAgo(t.ticket_updated_at ?? t.ticket_created_at)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Box>

      <Divider sx={{ borderColor: BORDER }} />
      <Box sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 10.5, color: TEXT_DIM }}>Click a ticket to open its full detail view</Typography>
      </Box>
    </Drawer>
  );
}