import { createTheme } from '@mui/material/styles';

// Material UI theme that integrates with our professional design system
export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'hsl(215, 50%, 25%)', // --primary
      light: 'hsl(215, 45%, 35%)', // --primary-light
      dark: 'hsl(215, 55%, 15%)', // --primary-dark
      contrastText: 'hsl(0, 0%, 98%)', // --primary-foreground
    },
    secondary: {
      main: 'hsl(215, 15%, 95%)', // --secondary
      contrastText: 'hsl(215, 25%, 25%)', // --secondary-foreground
    },
    success: {
      main: 'hsl(142, 69%, 58%)', // --success
      contrastText: 'hsl(0, 0%, 98%)',
    },
    warning: {
      main: 'hsl(43, 96%, 56%)', // --warning
      contrastText: 'hsl(215, 28%, 17%)',
    },
    error: {
      main: 'hsl(0, 72%, 51%)', // --destructive
      contrastText: 'hsl(0, 0%, 98%)',
    },
    background: {
      default: 'hsl(0, 0%, 99%)', // --background
      paper: 'hsl(0, 0%, 100%)', // --card
    },
    text: {
      primary: 'hsl(215, 28%, 17%)', // --foreground
      secondary: 'hsl(215, 15%, 45%)', // --muted-foreground
    },
    divider: 'hsl(215, 20%, 90%)', // --border
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12, // var(--radius)
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
          '&:hover': {
            background: 'linear-gradient(135deg, hsl(215, 55%, 20%), hsl(215, 50%, 30%))',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 hsl(215, 28%, 17%, 0.1), 0 1px 2px 0 hsl(215, 28%, 17%, 0.06)',
          border: '1px solid hsl(215, 20%, 90%)',
          background: 'linear-gradient(145deg, hsl(0, 0%, 100%), hsl(215, 15%, 98%))',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid hsl(215, 20%, 90%)',
          backgroundColor: 'hsl(0, 0%, 100%)',
        },
      },
    },
  },
});