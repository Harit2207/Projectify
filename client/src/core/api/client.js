import axios from 'axios';

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    // If running in production (e.g. on Vercel), but VITE_API_URL is missing or points to localhost,
    // fallback to the deployed production backend on Render.
    if (!isLocalhost && (!envUrl || envUrl.includes('localhost'))) {
      return 'https://projectify-api-yogd.onrender.com';
    }
  }
  return envUrl ?? 'http://localhost:5000';
}

const rawBaseUrl = getApiBaseUrl();
// Strip trailing /api or slash to prevent double /api/api calls
export const API_BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});
