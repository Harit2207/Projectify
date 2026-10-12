import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService.js';
import { toast } from 'sonner';

export const projectKeys = {
  all: ['projects'],
  lists: (workspaceId) => [...projectKeys.all, 'list', workspaceId],
  detail: (workspaceId, projectId) => [
    ...projectKeys.all,
    'detail',
    workspaceId,
    projectId,
  ],
  epics: (workspaceId, projectId) => [
    ...projectKeys.all,
    'epics',
    workspaceId,
    projectId,
  ],
};

export function useProjects(workspaceId) {
  return useQuery({
    queryKey: projectKeys.lists(workspaceId),
    queryFn: () => projectService.getAll(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useProject(workspaceId, projectId) {
  return useQuery({
    queryKey: projectKeys.detail(workspaceId, projectId),
    queryFn: () => projectService.getById({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useEpics(workspaceId, projectId) {
  return useQuery({
    queryKey: projectKeys.epics(workspaceId, projectId),
    queryFn: () => projectService.getEpics({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.create,
    onSuccess: (project, { workspaceId }) => {
      queryClient.setQueryData(
        projectKeys.lists(workspaceId),
        (old = []) => [project, ...old],
      );
      toast.success(`Project "${project.name}" created`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ?? 'Failed to create project',
      );
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.update,
    onSuccess: (updated, { workspaceId }) => {
      queryClient.setQueryData(
        projectKeys.detail(workspaceId, updated._id),
        updated,
      );
      queryClient.invalidateQueries({
        queryKey: projectKeys.lists(workspaceId),
      });
      toast.success('Project updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Update failed');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.delete,
    onSuccess: (_, { workspaceId, projectId }) => {
      queryClient.setQueryData(
        projectKeys.lists(workspaceId),
        (old = []) => old.filter((p) => p._id !== projectId),
      );
      queryClient.removeQueries({
        queryKey: projectKeys.detail(workspaceId, projectId),
      });
      toast.success('Project deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Delete failed');
    },
  });
}

export function useCreateEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.createEpic,
    onSuccess: (epic, { workspaceId, projectId }) => {
      queryClient.setQueryData(
        projectKeys.epics(workspaceId, projectId),
        (old = []) => [epic, ...old],
      );
      toast.success('Epic created');
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ?? 'Failed to create epic',
      );
    },
  });
}

export function useUpdateEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.updateEpic,
    onSuccess: (_, { workspaceId, projectId }) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.epics(workspaceId, projectId),
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Update failed');
    },
  });
}

export function useDeleteEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.deleteEpic,
    onSuccess: (_, { workspaceId, projectId, epicId }) => {
      queryClient.setQueryData(
        projectKeys.epics(workspaceId, projectId),
        (old = []) => old.filter((e) => e._id !== epicId),
      );
      toast.success('Epic deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Delete failed');
    },
  });
}
