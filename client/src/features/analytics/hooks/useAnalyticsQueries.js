import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService.js';

export const analyticsKeys = {
  workspace: (workspaceId) => ['analytics', 'workspace', workspaceId],
  project: (workspaceId, projectId) => [
    'analytics',
    'project',
    workspaceId,
    projectId,
  ],
};

export function useWorkspaceStats(workspaceId) {
  return useQuery({
    queryKey: analyticsKeys.workspace(workspaceId),
    queryFn: () => analyticsService.getWorkspaceStats(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectStats(workspaceId, projectId) {
  return useQuery({
    queryKey: analyticsKeys.project(workspaceId, projectId),
    queryFn: () =>
      analyticsService.getProjectStats(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
