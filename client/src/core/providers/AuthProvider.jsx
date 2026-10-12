import { useEffect } from 'react';
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

  useEffect(() => {
    if (data) setAuth(data);
  }, [data, setAuth]);

  useEffect(() => {
    if (isError) clearAuth();
  }, [isError, clearAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return children;
}
