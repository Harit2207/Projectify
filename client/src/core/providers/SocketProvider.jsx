import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';
import { useSocketStore } from '../store/socketStore.js';

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const { setSocket, setConnected } = useSocketStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(API_BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    setSocket(socket);

    socket.on('connect', () => setConnected(true));

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    return () => {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, setSocket, setConnected]);

  return children;
}
