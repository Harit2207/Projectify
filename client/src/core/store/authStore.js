import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token = null) =>
        set((state) => ({
          user,
          token: token || state.token,
          isAuthenticated: true,
        })),
      setToken: (token) =>
        set((state) => ({
          token,
          isAuthenticated: Boolean(token || state.user),
        })),
      clearAuth: () => {
        try {
          localStorage.removeItem('token');
        } catch (_err) {
          // ignore
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (partial) =>
        set((state) => ({ user: { ...state.user, ...partial } })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              name: state.user.name,
              email: state.user.email,
              avatar: state.user.avatar,
            }
          : null,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
