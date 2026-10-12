import { useAuthStore } from '../store/authStore.js';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth, updateUser } =
    useAuthStore();
  return { user, isAuthenticated, setAuth, clearAuth, updateUser };
}
