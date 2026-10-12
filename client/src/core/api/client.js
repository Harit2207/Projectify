import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
// Strip trailing /api or slash to prevent double /api/api calls
const API_BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});
