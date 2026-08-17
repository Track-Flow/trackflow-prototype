import { Box, Card, Typography } from '@mui/material';

export default function Stub({ title = 'Coming soon', icon = 'construction' }) {
  return (
    <Box sx={{ p: 6, display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 60px)' }}>
      <Card sx={{ p: 5, textAlign: 'center', maxWidth: 480, bgcolor: '#0f1f3a', border: '1px solid rgba(143,162,192,0.10)' }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
          display: 'grid', placeItems: 'center',
          background: 'rgba(46,200,255,0.08)', color: '#2ec8ff',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{icon}</span>
        </Box>
        <Typography variant="h5" sx={{ color: '#e6edf7', mb: 1 }}>{title}</Typography>
        <Typography sx={{ color: '#8fa2c0', fontSize: 13.5 }}>
          This page is being built. Check back soon.
        </Typography>
      </Card>
    </Box>
  );
}