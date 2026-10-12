import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket.js';
import { workspaceKeys } from '../../features/workspace/hooks/useWorkspaceQueries.js';

export function useWorkspaceSocket(workspaceId) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !workspaceId) return;

    socket.emit('workspace:join', workspaceId);

    function onMemberJoined() {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    }

    function onMemberRemoved() {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    }

    socket.on('member:joined', onMemberJoined);
    socket.on('member:removed', onMemberRemoved);

    return () => {
      socket.emit('workspace:leave', workspaceId);
      socket.off('member:joined', onMemberJoined);
      socket.off('member:removed', onMemberRemoved);
    };
  }, [socket, workspaceId, queryClient]);
}
