import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import { store } from './store/dashboard';

const theme = createTheme({
  palette: {
    background: { default: '#f5f7fa' },
    primary: { main: '#3563d5' },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: 'Inter, system-ui, sans-serif' },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find the root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
