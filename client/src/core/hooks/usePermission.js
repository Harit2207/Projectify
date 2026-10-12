import { useAuthStore } from '../store/authStore.js';
import { useWorkspaceStore } from '../store/workspaceStore.js';
import { useWorkspaces, useWorkspace } from '../../features/workspace/hooks/useWorkspaceQueries.js';

const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function usePermission(targetWorkspaceId) {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = targetWorkspaceId ?? currentWorkspace?.id ?? currentWorkspace?._id;

  // 1. Get full workspace detail if available
  const { data: workspaceDetail } = useWorkspace(workspaceId);
  // 2. Also fallback to workspaces list (which populates members)
  const { data: workspacesList } = useWorkspaces();

  const foundWsFromList = workspacesList?.find(
    (w) => w._id === workspaceId || w.id === workspaceId,
  );

  const activeWorkspace = workspaceDetail ?? foundWsFromList ?? (
    (!targetWorkspaceId || (currentWorkspace?._id === targetWorkspaceId || currentWorkspace?.id === targetWorkspaceId))
      ? currentWorkspace
      : null
  );

  const currentUserId = user?.id ?? user?._id?.toString();

  const currentRole = activeWorkspace?.members?.find((m) => {
    const memberUserId = m.userId?._id?.toString() ?? m.userId?.id?.toString() ?? m.userId?.toString();
    return String(memberUserId) === String(currentUserId);
  })?.role;

  function hasRole(allowedRoles) {
    if (!currentRole) return false;
    return allowedRoles.includes(currentRole);
  }

  function hasMinRole(minRole) {
    if (!currentRole) return false;
    return (
      (ROLE_HIERARCHY[currentRole] ?? 0) >=
      (ROLE_HIERARCHY[minRole] ?? 0)
    );
  }

  function isOwner() {
    return currentRole === 'owner';
  }

  return { currentRole, hasRole, hasMinRole, isOwner, isLoadingRole: !currentRole && !!workspaceId };
}
