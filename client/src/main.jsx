import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient.js';
import { setupInterceptors } from './core/api/interceptors.js';
import { ThemeProvider } from './core/providers/ThemeProvider.jsx';
import { AuthProvider } from './core/providers/AuthProvider.jsx';
import { SocketProvider } from './core/providers/SocketProvider.jsx';
import { AppRouter } from './core/router/AppRouter.jsx';
import './index.css';

setupInterceptors();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRouter />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
