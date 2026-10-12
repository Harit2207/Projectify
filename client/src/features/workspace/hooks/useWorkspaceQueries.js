import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../services/workspaceService.js';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { toast } from 'sonner';

export const workspaceKeys = {
  all: ['workspaces'],
  lists: () => [...workspaceKeys.all, 'list'],
  detail: (id) => [...workspaceKeys.all, 'detail', id],
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: workspaceService.getAll,
  });
}

export function useWorkspace(workspaceId) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => workspaceService.getById(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { setCurrentWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: workspaceService.create,
    onSuccess: (workspace) => {
      queryClient.setQueryData(workspaceKeys.lists(), (old = []) => [
        workspace,
        ...old,
      ]);
      setCurrentWorkspace(workspace);
      toast.success(`Workspace "${workspace.name}" created`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ?? 'Failed to create workspace',
      );
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(
        workspaceKeys.detail(updated._id),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      toast.success('Workspace updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Update failed');
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { clearWorkspace, currentWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: workspaceService.delete,
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      const currentId =
        currentWorkspace?.id ?? currentWorkspace?._id;
      if (currentId === workspaceId) clearWorkspace();
      toast.success('Workspace deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Delete failed');
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.inviteMember,
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      toast.success('Member invited successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Invite failed');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.updateMemberRole,
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Role update failed');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.removeMember,
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Remove failed');
    },
  });
}

