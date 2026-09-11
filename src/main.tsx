import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { App } from './App';
import { QuoteProvider } from './QuoteContext';
import './styles.css';
const theme = createTheme({
  palette: {
    primary: { main: '#173f35' },
    secondary: { main: '#ddeb92' },
    background: { default: '#f7f8f3', paper: '#fff' },
    text: { primary: '#203a32', secondary: '#626f67' },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: {
      fontSize: 'clamp(1.85rem, 3vw, 2.6rem)',
      fontWeight: 600,
      letterSpacing: '-0.04em',
      lineHeight: 1.15,
    },
    h4: { fontWeight: 500, letterSpacing: '-0.035em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: { root: { boxShadow: 'none', borderRadius: 8, padding: '11px 20px' } },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
  },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <QuoteProvider>
          <App />
        </QuoteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
