import { createTheme } from '@mui/material/styles';

const tfTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#5a8dc4' },
    secondary: { main: '#7a6fa8' },
    success:   { main: '#5a8f72' },
    warning:   { main: '#c49a4a' },
    error:     { main: '#b85c52' },
    background: {
      default: '#0c1422',
      paper:   '#111d2e',
    },
    text: {
      primary:   '#e3e8f0',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148,163,184,0.10)',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h4: { fontFamily: '"Rubik", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Rubik", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Rubik", sans-serif', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 6 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #5a8dc4 0%, #4275a8 100%)',
          color: '#fff',
          boxShadow: 'none',
          '&:hover': { background: 'linear-gradient(135deg, #6b9dd4 0%, #5a8dc4 100%)', boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#111d2e',
          border: '1px solid rgba(148,163,184,0.10)',
          borderRadius: 8,
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: 11, borderRadius: 4 } },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(12,20,34,0.5)',
            '& fieldset': { borderColor: 'rgba(148,163,184,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.30)' },
            '&.Mui-focused fieldset': { borderColor: '#5a8dc4' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e2d42 transparent',
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#1e2d42', borderRadius: 3 },
        },
      },
    },
  },
});

export default tfTheme;