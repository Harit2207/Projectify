import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../core/hooks/useSocket.js';
import { taskKeys } from './useTaskQueries.js';

export function useTaskSocketSync(workspaceId, projectId) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('project:join', projectId);

    const groupedQueryKey = [
      ...taskKeys.all,
      'grouped',
      workspaceId,
      projectId,
    ];

    function refreshGroupedTasks() {
      queryClient.invalidateQueries({ queryKey: groupedQueryKey });
    }

    socket.on('task:created', refreshGroupedTasks);
    socket.on('task:updated', refreshGroupedTasks);
    socket.on('task:deleted', refreshGroupedTasks);
    socket.on('task:reordered', refreshGroupedTasks);

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('task:created', refreshGroupedTasks);
      socket.off('task:updated', refreshGroupedTasks);
      socket.off('task:deleted', refreshGroupedTasks);
      socket.off('task:reordered', refreshGroupedTasks);
    };
  }, [socket, projectId, workspaceId, queryClient]);
}
