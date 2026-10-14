import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { authService } from '../../features/auth/services/authService.js';

export function AuthProvider({ children }) {
  const { setAuth, setToken, clearAuth } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  // 1. Immediately capture token from URL query string if redirected from Google OAuth
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = searchParams.get('token');
      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        localStorage.setItem('token', tokenFromUrl);
        // Clean token from address bar without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.error('Error parsing auth token from URL:', e);
    }
  }, [setToken]);

  const { isLoading, data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (data) {
      const existingToken = useAuthStore.getState().token || localStorage.getItem('token');
      setAuth(data, existingToken);
      setAuthReady(true);
    } else if (isError) {
      // If error occurs, check if token is valid or expired
      const token = useAuthStore.getState().token || localStorage.getItem('token');
      if (!token) {
        clearAuth();
      }
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
