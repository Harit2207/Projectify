import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspaceQueries.js';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { PageShell } from '../../../shared/components/layout/PageShell.jsx';
import { MembersTable } from '../components/MembersTable.jsx';
import { InviteMemberForm } from '../components/InviteMemberForm.jsx';

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams();
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const { hasMinRole } = usePermission(workspaceId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageShell
      title="Workspace members"
      description={`View and manage team members for ${workspace?.name ?? 'workspace'}`}
    >
      <div className="max-w-2xl space-y-6">
        {hasMinRole('admin') && (
          <section>
            <InviteMemberForm workspaceId={workspaceId} />
          </section>
        )}

        <section>
          <h2 className="text-base font-semibold mb-3">
            Members ({workspace?.members?.length ?? 0})
          </h2>
          <MembersTable
            members={workspace?.members ?? []}
            workspaceId={workspaceId}
          />
        </section>
      </div>
    </PageShell>
  );
}
