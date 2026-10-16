import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  useWorkspaces,
  useDeleteWorkspace,
  useRemoveMember,
} from '../hooks/useWorkspaceQueries.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { useWorkspaceStore } from '../../../core/store/workspaceStore.js';
import { useUiStore } from '../../../core/store/uiStore.js';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '../hooks/useWorkspaceQueries.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { PageShell } from '../../../shared/components/layout/PageShell.jsx';
import { EmptyState } from '../../../shared/components/feedback/EmptyState.jsx';
import { WorkspaceSkeleton } from '../../../shared/components/feedback/WorkspaceSkeleton.jsx';
import { WorkspaceCard } from '../components/WorkspaceCard.jsx';
import { ConfirmDialog } from '../../../shared/components/modals/ConfirmDialog.jsx';

export default function WorkspacesPage() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? user?._id?.toString();

  const { data: workspaces, isLoading } = useWorkspaces();
  const { mutate: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspace();
  const { mutate: removeMember, isPending: isLeaving } = useRemoveMember();
  const { setCurrentWorkspace } = useWorkspaceStore();
  const { openCreateWorkspace } = useUiStore();

  function handleSelect(workspace) {
    setCurrentWorkspace(workspace);
    navigate(`/workspace/${workspace._id}/projects`);
  }

  function handleLeave() {
    if (!leaveTarget) return;
    removeMember(
      { workspaceId: leaveTarget._id, memberId: currentUserId },
      {
        onSuccess: () => {
          setLeaveTarget(null);
          queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
        },
      },
    );
  }

  if (isLoading) return <WorkspaceSkeleton />;

  return (
    <PageShell
      title="Workspaces"
      description="Manage your workspaces and teams"
      action={
        <Button onClick={openCreateWorkspace}>
          <Plus className="mr-2 h-4 w-4" />
          New workspace
        </Button>
      }
    >
      {!workspaces?.length ? (
        <EmptyState
          title="No workspaces yet"
          description="Create your first workspace to start collaborating"
          action={
            <Button onClick={openCreateWorkspace}>
              <Plus className="mr-2 h-4 w-4" />
              Create workspace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace._id}
              workspace={workspace}
              onSelect={() => handleSelect(workspace)}
              onSettings={() =>
                navigate(`/workspace/${workspace._id}/settings`)
              }
              onDelete={() => setDeleteTarget(workspace)}
              onLeave={() => setLeaveTarget(workspace)}
            />
          ))}
        </div>
      )}

      {/* Delete Workspace Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete workspace"
        description={`"${deleteTarget?.name}" and all its data will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() =>
          deleteWorkspace(deleteTarget._id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Leave Workspace Dialog */}
      <ConfirmDialog
        open={!!leaveTarget}
        title="Leave workspace"
        description={`Are you sure you want to leave "${leaveTarget?.name}"? You will lose access to its projects and tasks.`}
        confirmLabel="Leave workspace"
        variant="destructive"
        isLoading={isLeaving}
        onConfirm={handleLeave}
        onCancel={() => setLeaveTarget(null)}
      />
    </PageShell>
  );
}
