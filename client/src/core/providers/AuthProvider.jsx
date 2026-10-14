import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { authService } from '../../features/auth/services/authService.js';

export function AuthProvider({ children }) {
  const { setAuth, clearAuth } = useAuthStore();

  const { isLoading, data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Becomes true once, after the first /auth/me response has been written into
  // the auth store. Routes must not render before that: ProtectedRoute would
  // otherwise see the stale persisted isAuthenticated=false (for example right
  // after the Google redirect) and send the user to /login.
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (data) setAuth(data);
    else if (isError) clearAuth();
    setAuthReady(true);
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
