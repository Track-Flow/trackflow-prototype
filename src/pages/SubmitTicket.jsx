import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Dialog, DialogContent } from '@mui/material';

const ACCENT = '#5a8dc4';
const PAPER  = '#111d2e';
const BORDER = 'rgba(148,163,184,0.10)';

const CATEGORIES = [
  { id: 'it',    name: 'IT Support',       icon: 'computer',        color: '#5a8dc4', bg: 'rgba(90,141,196,0.12)',  dept: 'it'    },
  { id: 'fac',   name: 'Facilities',       icon: 'build',           color: '#c49a4a', bg: 'rgba(196,154,74,0.12)',  dept: 'fac'   },
  { id: 'admin', name: 'Administration',   icon: 'business_center', color: '#7a6fa8', bg: 'rgba(122,111,168,0.12)', dept: 'admin' },
  { id: 'lib',   name: 'Library Services', icon: 'menu_book',       color: '#5a8f72', bg: 'rgba(90,143,114,0.12)',  dept: 'lib'   },
  { id: 'other', name: 'Other',            icon: 'help',            color: '#7a6fa8', bg: 'rgba(122,111,168,0.12)', dept: null    },
];

function Stepper({ step }) {
  const steps = ['Category', 'Details', 'Review'];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      {steps.map((label, i) => {
        const idx    = i + 1;
        const done   = step > idx;
        const active = step === idx;
        const color  = done ? '#5a8f72' : active ? ACCENT : '#475569';
        const bg     = done ? 'rgba(90,143,114,0.15)' : active ? 'rgba(90,141,196,0.15)' : 'rgba(71,85,105,0.2)';
        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                bgcolor: bg, border: `1.5px solid ${color}`,
                fontSize: 11, fontWeight: 700, color, flexShrink: 0,
              }}>
                {done
                  ? <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                  : idx}
              </Box>
              <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: active || done ? 600 : 400, color, whiteSpace: 'nowrap' }}>
                {label}
              </Typography>
            </Box>
            {i < steps.length - 1 && (
              <Box sx={{ flex: 1, height: 1.5, mx: 1, bgcolor: done ? '#5a8f72' : BORDER, borderRadius: 1, minWidth: 12 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function StepCategory({ selected, onSelect }) {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700, color: '#e3e8f0', mb: 0.5 }}>
        What is this about?
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#94a3b8', mb: 2, lineHeight: 1.6 }}>
        Pick the closest category. If none fits, choose{' '}
        <span style={{ color: '#7a6fa8', fontWeight: 700 }}>Other</span>
        {' '}— a help-desk admin will route your ticket.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
        {CATEGORIES.map(cat => {
          const active = selected?.id === cat.id;
          return (
            <Box
              key={cat.id}
              onClick={() => onSelect(cat)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                p: { xs: 1.5, md: 2 }, borderRadius: 1.5, cursor: 'pointer',
                border: `1.5px solid ${active ? cat.color : BORDER}`,
                bgcolor: active ? cat.bg : 'rgba(255,255,255,0.03)',
                transition: 'all .15s',
                '&:hover': { border: `1.5px solid ${cat.color}`, bgcolor: cat.bg },
              }}
            >
              <Box sx={{
                width: 38, height: 38, borderRadius: 1.5, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                bgcolor: cat.bg, color: cat.color,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{cat.icon}</span>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#e3e8f0' }}>{cat.name}</Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                  {cat.id === 'other' ? 'Help-desk admin will route' : `→ ${cat.name} dept`}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function StepDetails({ form, onChange, files, onFiles }) {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700, color: '#e3e8f0', mb: 2 }}>
        Tell us more
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          placeholder="Subject"
          value={form.title}
          onChange={e => onChange('title', e.target.value)}
          fullWidth inputProps={{ maxLength: 150 }}
        />
        <TextField
          placeholder="Describe the problem"
          value={form.description}
          onChange={e => onChange('description', e.target.value)}
          fullWidth multiline rows={4}
          inputProps={{ maxLength: 1000 }}
        />
        <Box>
          <input type="file" multiple id="tf-attach" style={{ display: 'none' }}
            onChange={e => onFiles(Array.from(e.target.files))} />
          <Button component="label" htmlFor="tf-attach" variant="outlined" size="small"
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 15 }}>attach_file</span>}
            sx={{ color: '#94a3b8', borderColor: BORDER, fontSize: 12 }}>
            Attach files
          </Button>
          {files.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {files.map((f, i) => (
                <Box key={i} sx={{ px: 1.25, py: 0.4, borderRadius: 1, fontSize: 11.5, bgcolor: 'rgba(90,141,196,0.1)', color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                  {f.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function StepReview({ form, category, files }) {
  const labelSx = { fontSize: 10.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 };
  const valueSx = { fontSize: 13.5, color: '#e3e8f0', fontWeight: 500 };
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700, color: '#e3e8f0', mb: 2 }}>Review</Typography>
      <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={labelSx}>Category</Typography>
          <Typography sx={valueSx}>{category?.name}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography sx={labelSx}>Subject</Typography>
          <Typography sx={valueSx}>{form.title}</Typography>
        </Box>
        <Box sx={{ mb: files.length > 0 ? 2 : 0 }}>
          <Typography sx={labelSx}>Description</Typography>
          <Typography sx={{ ...valueSx, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 13 }}>{form.description}</Typography>
        </Box>
        {files.length > 0 && (
          <Box>
            <Typography sx={labelSx}>Attachments</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
              {files.map((f, i) => (
                <Box key={i} sx={{ px: 1.25, py: 0.4, borderRadius: 1, fontSize: 11.5, bgcolor: 'rgba(90,141,196,0.1)', color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                  {f.name}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function SuccessDialog({ open, ticketId, onViewTicket, onAnother }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} PaperProps={{
      sx: { bgcolor: PAPER, border: `1px solid ${BORDER}`, borderRadius: 2, p: 1, width: { xs: '95vw', sm: 420 }, maxWidth: '95vw', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }
    }}>
      <DialogContent sx={{ textAlign: 'center', py: 4, px: { xs: 2, sm: 4 } }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2.5, display: 'grid', placeItems: 'center', bgcolor: 'rgba(90,143,114,0.12)', border: '2px solid #5a8f72' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#5a8f72' }}>check</span>
        </Box>
        <Typography variant="h5" sx={{ color: '#e3e8f0', fontFamily: '"Rubik", sans-serif', fontWeight: 700, mb: 0.5 }}>Ticket submitted!</Typography>
        <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: ACCENT, mb: 1 }}>{ticketId}</Typography>
        <Typography sx={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, mb: 3 }}>
          Your request has been received. We'll get back to you shortly.
        </Typography>
        <Button variant="contained" fullWidth onClick={onViewTicket} sx={{ py: 1.2, fontWeight: 700, mb: 1 }}>View ticket</Button>
        <Button fullWidth onClick={() => navigate('/home/tickets')} sx={{ py: 0.9, color: '#94a3b8', fontSize: 13, mb: 0.5 }}>View my tickets</Button>
        <Button fullWidth onClick={onAnother} sx={{ py: 0.9, color: '#94a3b8', fontSize: 13 }}>Submit another</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function SubmitTicket({ onSubmit }) {
  const navigate = useNavigate();
  const [step,     setStep]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({ title: '', description: '' });
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [newId,    setNewId]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const canContinue = () => {
    if (step === 1) return !!selected;
    if (step === 2) return form.title.trim().length > 2 && form.description.trim().length > 2;
    return true;
  };

  function handleNext() {
    if (step < 3) { setStep(s => s + 1); return; }
    setLoading(true);
    setTimeout(() => {
      const id  = 'TF-' + (1845 + Math.floor(Math.random() * 100));
      const now = new Date().toISOString();
      const ticket = { id, title: form.title, category: selected.name, description: form.description, status: selected.id === 'other' ? 'unrouted' : 'open', dept: selected.dept, requesterId: 9, assigneeId: null, createdAt: now, updatedAt: now };
      if (onSubmit) onSubmit(ticket);
      setNewId(id); setLoading(false); setSuccess(true);
    }, 1000);
  }

  function handleAnother() {
    setStep(1); setSelected(null); setForm({ title: '', description: '' }); setFiles([]); setNewId(''); setSuccess(false);
  }

  return (
    <Box>
      <SuccessDialog open={success} ticketId={newId} onViewTicket={() => navigate(`/tickets/${newId}`)} onAnother={handleAnother} />

      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.5 }}>New request</Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: '#e3e8f0', fontFamily: '"Rubik", sans-serif', fontWeight: 700 }}>Submit a ticket</Typography>
      </Box>

      <Box sx={{ height: 1, bgcolor: BORDER, mb: 2.5 }} />

      <Card sx={{ p: { xs: 2, md: 3 }, bgcolor: PAPER, border: `1px solid ${BORDER}`, maxWidth: 800, width: '100%' }}>
        <Stepper step={step} />
        {step === 1 && <StepCategory selected={selected} onSelect={setSelected} />}
        {step === 2 && <StepDetails form={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} files={files} onFiles={setFiles} />}
        {step === 3 && <StepReview form={form} category={selected} files={files} />}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          {step > 1
            ? <Typography onClick={() => setStep(s => s - 1)} sx={{ fontSize: 13, color: ACCENT, cursor: 'pointer', fontWeight: 600 }}>← Back</Typography>
            : <Box />}
          <Button variant="contained" disabled={!canContinue() || loading} onClick={handleNext}
            startIcon={step === 3 ? <span className="material-symbols-outlined" style={{ fontSize: 15 }}>send</span> : null}
            sx={{ px: { xs: 2.5, md: 3.5 }, py: 0.9, fontWeight: 700 }}>
            {loading ? 'Submitting…' : step === 3 ? 'Submit ticket' : 'Continue →'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}