import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { authService } from '../../features/auth/services/authService.js';

// Synchronously capture token from URL query string BEFORE any queries run
if (typeof window !== 'undefined') {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      useAuthStore.getState().setToken(tokenFromUrl);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (e) {
    console.error('Error extracting auth token:', e);
  }
}

export function AuthProvider({ children }) {
  const { setAuth, clearAuth } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  const { isLoading, data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: false, // Don't loop retries on 401
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isLoading) return;

    if (data) {
      const token = useAuthStore.getState().token || localStorage.getItem('token');
      setAuth(data, token);
      setAuthReady(true);
    } else if (isError) {
      // If /auth/me returns 401, session is invalid or expired
      clearAuth();
      setAuthReady(true);
    } else {
      setAuthReady(true);
    }
  }, [isLoading, data, isError, setAuth, clearAuth]);

  if (isLoading || !authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return children;
}
