import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService.js';
import { useSocket } from '../../../core/hooks/useSocket.js';

export const notificationKeys = {
  all: ['notifications'],
  list: (page) => [...notificationKeys.all, 'list', page],
};

export function useNotifications(page = 1) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const query = useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationService.getAll(page),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!socket) return;

    function onNewNotification({ notification }) {
      queryClient.setQueryData(notificationKeys.list(1), (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: (old.unreadCount ?? 0) + 1,
          notifications: [notification, ...(old.notifications ?? [])],
        };
      });
    }

    socket.on('notification:new', onNewNotification);

    return () => {
      socket.off('notification:new', onNewNotification);
    };
  }, [socket, queryClient]);

  return query;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (updated) => {
      queryClient.setQueryData(notificationKeys.list(1), (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, (old.unreadCount ?? 0) - 1),
          notifications: (old.notifications ?? []).map((n) =>
            n._id === updated._id ? { ...n, read: true } : n,
          ),
        };
      });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(notificationKeys.list(1), (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: 0,
          notifications: (old.notifications ?? []).map((n) => ({
            ...n,
            read: true,
          })),
        };
      });
    },
  });
}
