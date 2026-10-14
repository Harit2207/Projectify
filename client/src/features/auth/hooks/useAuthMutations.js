import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { toast } from 'sonner';

function getErrorMessage(error, defaultMsg) {
  const data = error.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.message).join(' | ');
  }
  return data?.message ?? defaultMsg;
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const user = data.user || data;
      const token = data.accessToken || null;
      setAuth(user, token);
      if (token) localStorage.setItem('token', token);
      queryClient.setQueryData(['auth', 'me'], user);
      navigate('/dashboard');
      toast.success(`Welcome back, ${user.name}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Login failed'));
    },
  });
}

export function useSignup() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      const user = data.user || data;
      const token = data.accessToken || null;
      setAuth(user, token);
      if (token) localStorage.setItem('token', token);
      queryClient.setQueryData(['auth', 'me'], user);
      navigate('/dashboard');
      toast.success('Account created successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Signup failed'));
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast.success('Check your email for a reset link');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Something went wrong'));
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to reset password'));
    },
  });
}
