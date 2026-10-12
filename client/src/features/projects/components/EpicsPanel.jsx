import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useEpics,
  useDeleteEpic,
} from '../hooks/useProjectQueries.js';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Progress } from '../../../shared/components/ui/progress.jsx';
import { Badge } from '../../../shared/components/ui/badge.jsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../shared/components/ui/collapsible.jsx';
import { CreateEpicModal } from './CreateEpicModal.jsx';
import { ConfirmDialog } from '../../../shared/components/modals/ConfirmDialog.jsx';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { formatDate } from '../../../shared/utils/date.js';

const EPIC_STATUS_COLORS = {
  planned: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
};

export function EpicsPanel({ workspaceId, projectId }) {
  const [open, setOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: epics, isLoading } = useEpics(workspaceId, projectId);
  const { mutate: deleteEpic, isPending: isDeleting } = useDeleteEpic();
  const { hasMinRole } = usePermission(workspaceId);

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Epics
            <span className="text-xs text-muted-foreground font-normal ml-1">
              ({epics?.length ?? 0})
            </span>
          </CollapsibleTrigger>

          {hasMinRole('admin') && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add epic
            </Button>
          )}
        </div>

        <CollapsibleContent>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : !epics?.length ? (
            <p className="text-xs text-muted-foreground p-4">
              No epics yet. Epics group related tasks together.
            </p>
          ) : (
            <div className="divide-y">
              {epics.map((epic) => (
                <div key={epic._id} className="group px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: epic.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {epic.title}
                        </p>
                        {epic.endDate && (
                          <p className="text-xs text-muted-foreground">
                            Due {formatDate(epic.endDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={EPIC_STATUS_COLORS[epic.status]}
                        className="text-xs"
                      >
                        {epic.status.replace('_', ' ')}
                      </Badge>

                      {hasMinRole('admin') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteTarget(epic)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {epic.taskStats?.completed ?? 0}/
                        {epic.taskStats?.total ?? 0} tasks
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {epic.progress ?? 0}%
                      </span>
                    </div>
                    <Progress
                      value={epic.progress ?? 0}
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <CreateEpicModal
        workspaceId={workspaceId}
        projectId={projectId}
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete epic"
        description={`Delete "${deleteTarget?.title}"? Tasks in this epic will not be deleted.`}
        confirmLabel="Delete epic"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() =>
          deleteEpic(
            { workspaceId, projectId, epicId: deleteTarget._id },
            { onSuccess: () => setDeleteTarget(null) },
          )
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
