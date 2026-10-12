import { apiClient } from '../../../core/api/client.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const authService = {
  signup: async (data) => {
    const res = await apiClient.post(ENDPOINTS.auth.signup, data);
    return res.data.data.user;
  },

  login: async (data) => {
    const res = await apiClient.post(ENDPOINTS.auth.login, data);
    return res.data.data.user;
  },

  getMe: async () => {
    const res = await apiClient.get(ENDPOINTS.auth.me);
    return res.data.data.user;
  },

  logout: async () => {
    await apiClient.post(ENDPOINTS.auth.logout);
  },

  resetPassword: async ({ token, password }) => {
    const res = await apiClient.post(ENDPOINTS.auth.resetPassword, {
      token,
      password,
    });
    return res.data;
  },

  forgotPassword: async (data) => {
    const res = await apiClient.post(ENDPOINTS.auth.forgotPassword, data);
    return res.data;
  },

  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  },
};
