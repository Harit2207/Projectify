import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { CreateTaskInline } from './CreateTaskInline.jsx';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { COLUMN_COLORS } from '../constants/taskConstants.js';

export function KanbanColumn({
  status,
  label,
  tasks,
  workspaceId,
  projectId,
  onTaskClick,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const { hasMinRole } = usePermission();

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${COLUMN_COLORS[status]}`}
          />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        {hasMinRole('member') && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-accent/50' : 'bg-muted/30'
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task._id)}
            />
          ))}
        </SortableContext>

        {showCreate && (
          <CreateTaskInline
            workspaceId={workspaceId}
            projectId={projectId}
            status={status}
            onDone={() => setShowCreate(false)}
          />
        )}
      </div>
    </div>
  );
}
