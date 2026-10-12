import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService.js';
import { toast } from 'sonner';

export const taskKeys = {
  all: ['tasks'],
  grouped: (workspaceId, projectId, filters) => [
    ...taskKeys.all,
    'grouped',
    workspaceId,
    projectId,
    filters,
  ],
  detail: (workspaceId, taskId) => [
    ...taskKeys.all,
    'detail',
    workspaceId,
    taskId,
  ],
};

export function useGroupedTasks(workspaceId, projectId, filters = {}) {
  return useQuery({
    queryKey: taskKeys.grouped(workspaceId, projectId, filters),
    queryFn: () =>
      taskService.getGrouped({ workspaceId, projectId, filters }),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useTask(workspaceId, taskId) {
  return useQuery({
    queryKey: taskKeys.detail(workspaceId, taskId),
    queryFn: () => taskService.getById({ workspaceId, taskId }),
    enabled: !!workspaceId && !!taskId,
  });
}

export function useCreateTask(workspaceId, projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.create,
    onSuccess: (task) => {
      queryClient.setQueryData(
        taskKeys.grouped(workspaceId, projectId, {}),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            [task.status]: [...(old[task.status] ?? []), task],
          };
        },
      );
      toast.success('Task created');
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ?? 'Failed to create task',
      );
    },
  });
}

export function useUpdateTask(workspaceId, projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.update,
    onMutate: async ({ taskId, data }) => {
      const groupedKey = taskKeys.grouped(workspaceId, projectId, {});
      const detailKey = taskKeys.detail(workspaceId, taskId);

      await Promise.all([
        queryClient.cancelQueries({ queryKey: groupedKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
      ]);

      const previousTasks = queryClient.getQueryData(groupedKey);
      const previousDetail = queryClient.getQueryData(detailKey);

      // Optimistically update single task detail in modal
      if (previousDetail) {
        queryClient.setQueryData(detailKey, (old) =>
          old ? { ...old, ...data } : old,
        );
      }

      // Optimistically update grouped tasks on the board
      queryClient.setQueryData(groupedKey, (old) => {
        if (!old) return old;
        const updated = { ...old };

        if (data.status) {
          let foundTask = null;
          for (const s of Object.keys(updated)) {
            const filtered = updated[s].filter((t) => {
              if (t._id === taskId) {
                foundTask = t;
                return false;
              }
              return true;
            });
            updated[s] = filtered;
          }

          if (foundTask) {
            const targetCol = updated[data.status] ?? [];
            updated[data.status] = [...targetCol, { ...foundTask, ...data }];
          }
        } else {
          for (const s of Object.keys(updated)) {
            updated[s] = updated[s].map((t) =>
              t._id === taskId ? { ...t, ...data } : t,
            );
          }
        }

        return updated;
      });

      return { previousTasks, previousDetail };
    },
    onSuccess: (updatedTask, { taskId }) => {
      if (updatedTask) {
        queryClient.setQueryData(
          taskKeys.detail(workspaceId, taskId),
          updatedTask,
        );
      }
    },
    onError: (error, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.grouped(workspaceId, projectId, {}),
          context.previousTasks,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          taskKeys.detail(workspaceId, taskId),
          context.previousDetail,
        );
      }
      toast.error(error.response?.data?.message ?? 'Update failed');
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.grouped(workspaceId, projectId, {}),
      });
      if (taskId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(workspaceId, taskId),
        });
      }
    },
  });
}

export function useDeleteTask(workspaceId, projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.delete,
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({
        queryKey: taskKeys.grouped(workspaceId, projectId, {}),
      });

      const previousTasks = queryClient.getQueryData(
        taskKeys.grouped(workspaceId, projectId, {}),
      );

      queryClient.setQueryData(
        taskKeys.grouped(workspaceId, projectId, {}),
        (old) => {
          if (!old) return old;
          const updated = { ...old };
          for (const status of Object.keys(updated)) {
            updated[status] = updated[status].filter(
              (t) => t._id !== taskId,
            );
          }
          return updated;
        },
      );

      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.grouped(workspaceId, projectId, {}),
          context.previousTasks,
        );
      }
      toast.error(error.response?.data?.message ?? 'Delete failed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.grouped(workspaceId, projectId, {}),
      });
    },
  });
}

export function useReorderTasks(workspaceId, projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.reorder,
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.grouped(workspaceId, projectId, {}),
      });
      toast.error('Failed to save order — reloading board');
    },
  });
}
