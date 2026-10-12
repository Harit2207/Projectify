import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission.js';
import { useWorkspace } from '../../../features/workspace/hooks/useWorkspaceQueries.js';
import { useAuthStore } from '../../store/authStore.js';
import { useWorkspaceStore } from '../../store/workspaceStore.js';

export function RoleGuard({ allowedRoles }) {
  const { workspaceId } = useParams();
  const { user } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { hasRole, isLoadingRole } = usePermission(workspaceId);
  const { data: workspace, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);

  useEffect(() => {
    if (workspace && (!currentWorkspace || (currentWorkspace._id !== workspace._id && currentWorkspace.id !== workspace._id))) {
      setCurrentWorkspace(workspace);
    }
  }, [workspace, currentWorkspace, setCurrentWorkspace]);

  // If role is available from usePermission
  if (hasRole(allowedRoles)) {
    return <Outlet />;
  }

  // If workspace is still loading from API
  if (isLoadingRole || isLoadingWorkspace) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Fallback check directly from loaded workspace
  if (workspace?.members) {
    const currentUserId = user?.id ?? user?._id?.toString();
    const role = workspace.members.find((m) => {
      const memberUserId = m.userId?._id?.toString() ?? m.userId?.id?.toString() ?? m.userId?.toString();
      return String(memberUserId) === String(currentUserId);
    })?.role;

    if (role && allowedRoles.includes(role)) {
      return <Outlet />;
    }
  }

  return <Navigate to="/dashboard" replace />;
}
