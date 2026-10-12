import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { taskService } from '../../tasks/services/taskService.js';

export function useSearchTasks(workspaceId, query) {
  return useQuery({
    queryKey: ['search', 'tasks', workspaceId, query],
    queryFn: () => taskService.search({ workspaceId, query }),
    enabled: !!workspaceId && !!query && query.length >= 1,
    staleTime: 30 * 1000,
  });
}

export function usePaginatedSearch(workspaceId, query, page = 1) {
  return useQuery({
    queryKey: ['search', 'paginated', workspaceId, query, page],
    queryFn: () =>
      taskService.searchPaginated({ workspaceId, query, page, limit: 20 }),
    enabled: !!workspaceId && !!query && query.length >= 1,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
