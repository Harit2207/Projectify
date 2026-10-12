import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  useProjects,
  useDeleteProject,
} from '../hooks/useProjectQueries.js';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { PageShell } from '../../../shared/components/layout/PageShell.jsx';
import { EmptyState } from '../../../shared/components/feedback/EmptyState.jsx';
import { ProjectsListSkeleton } from '../../../shared/components/feedback/ProjectsSkeleton.jsx';
import { ProjectCard } from '../components/ProjectCard.jsx';
import { CreateProjectModal } from '../components/CreateProjectModal.jsx';
import { ConfirmDialog } from '../../../shared/components/modals/ConfirmDialog.jsx';

export default function ProjectsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: projects, isLoading } = useProjects(workspaceId);
  const { mutate: deleteProject, isPending: isDeleting } =
    useDeleteProject();
  const { hasMinRole } = usePermission();

  if (isLoading) return <ProjectsListSkeleton />;

  return (
    <PageShell
      title="Projects"
      description="Manage your team's projects"
      action={
        hasMinRole('member') && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Button>
        )
      }
    >
      {!projects?.length ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start organizing tasks"
          action={
            hasMinRole('member') && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create project
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onOpen={() =>
                navigate(
                  `/workspace/${workspaceId}/board/${project._id}`,
                )
              }
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        workspaceId={workspaceId}
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete project"
        description={`Delete "${deleteTarget?.name}"? All tasks and epics will be permanently removed.`}
        confirmLabel="Delete project"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() =>
          deleteProject(
            { workspaceId, projectId: deleteTarget._id },
            { onSuccess: () => setDeleteTarget(null) },
          )
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
