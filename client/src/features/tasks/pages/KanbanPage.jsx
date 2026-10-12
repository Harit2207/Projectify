import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGroupedTasks,
  useReorderTasks,
  taskKeys,
} from '../hooks/useTaskQueries.js';
import { useTaskFilters } from '../hooks/useTaskFilters.js';
import { useTaskSocketSync } from '../hooks/useTaskSocketSync.js';
import { KanbanColumn } from '../components/KanbanColumn.jsx';
import { TaskCard } from '../components/TaskCard.jsx';
import { TaskModal } from '../components/TaskModal.jsx';
import { TaskFilters } from '../components/TaskFilters.jsx';
import { EpicsPanel } from '../../projects/components/EpicsPanel.jsx';
import { KanbanSkeleton } from '../../../shared/components/feedback/KanbanSkeleton.jsx';
import { STATUSES, STATUS_LABELS } from '../constants/taskConstants.js';

export default function KanbanPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();

  const [activeTask, setActiveTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const { filters, setFilter, clearFilters, hasFilters } = useTaskFilters();
  const { data: tasks, isLoading } = useGroupedTasks(
    workspaceId,
    projectId,
    filters,
  );
  const { mutate: reorder } = useReorderTasks(workspaceId, projectId);

  useTaskSocketSync(workspaceId, projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragStart({ active }) {
    for (const status of STATUSES) {
      const found = tasks?.[status]?.find((t) => t._id === active.id);
      if (found) {
        setActiveTask(found);
        break;
      }
    }
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;

    let sourceStatus = null;
    let destStatus = null;
    let destIndex = 0;

    for (const status of STATUSES) {
      const col = tasks[status] ?? [];
      if (col.find((t) => t._id === activeId)) sourceStatus = status;
      const overIdx = col.findIndex((t) => t._id === overId);
      if (overIdx !== -1) {
        destStatus = status;
        destIndex = overIdx;
      }
      if (overId === status) {
        destStatus = status;
        destIndex = (tasks[status] ?? []).length;
      }
    }

    if (!sourceStatus || !destStatus) return;

    const destCol = tasks[destStatus] ?? [];
    const prev = destCol[destIndex - 1];
    const next = destCol[destIndex];

    const newPosition =
      prev && next
        ? (prev.position + next.position) / 2
        : prev
        ? prev.position + 1000
        : next
        ? next.position / 2
        : 1000;

    const cacheKey = taskKeys.grouped(workspaceId, projectId, filters);

    queryClient.setQueryData(cacheKey, (old) => {
      if (!old) return old;
      const updated = { ...old };

      updated[sourceStatus] = updated[sourceStatus].filter(
        (t) => t._id !== activeId,
      );

      const movedTask = {
        ...activeTask,
        status: destStatus,
        position: newPosition,
      };
      const destArray = [...(updated[destStatus] ?? [])];
      destArray.splice(destIndex, 0, movedTask);
      updated[destStatus] = destArray;

      return updated;
    });

    reorder({
      workspaceId,
      projectId,
      updates: [
        { taskId: activeId, status: destStatus, position: newPosition },
      ],
    });
  }

  if (isLoading) return <KanbanSkeleton />;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <div className="w-64 border-r overflow-y-auto flex-shrink-0 hidden lg:block">
        <EpicsPanel workspaceId={workspaceId} projectId={projectId} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-4 py-2">
          <TaskFilters
            workspaceId={workspaceId}
            filters={filters}
            onChange={setFilter}
            onClear={clearFilters}
            hasFilters={hasFilters}
          />
        </div>

        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 p-4 h-full min-w-max">
              {STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  label={STATUS_LABELS[status]}
                  tasks={tasks?.[status] ?? []}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  isDragging
                  onClick={() => {}}
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <TaskModal
        workspaceId={workspaceId}
        projectId={projectId}
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
