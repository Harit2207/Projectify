import { useSocketStore } from '../store/socketStore.js';

export function useSocket() {
  const { socket, isConnected } = useSocketStore();
  return { socket, isConnected };
}
