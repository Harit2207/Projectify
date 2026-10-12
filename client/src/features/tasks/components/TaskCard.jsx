import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../shared/components/ui/avatar.jsx';
import { PriorityIcon } from './PriorityIcon.jsx';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '../../../shared/utils/cn.js';

export function TaskCard({ task, onClick, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const isOverdue =
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    task.status !== 'done';
  const isDueToday =
    task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-background border rounded-lg p-3 cursor-pointer',
        'hover:border-primary/50 transition-all select-none',
        'shadow-sm hover:shadow-md',
        isDragging && 'shadow-xl rotate-1 scale-105',
      )}
    >
      {task.epicId && (
        <div className="flex items-center gap-1 mb-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: task.epicId.color }}
          />
          <span className="text-xs text-muted-foreground truncate">
            {task.epicId.title}
          </span>
        </div>
      )}

      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>

      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-xs bg-muted px-1.5 py-0.5 rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={task.priority} />

          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs',
                isOverdue && 'text-destructive',
                isDueToday && 'text-amber-500',
                !isOverdue &&
                  !isDueToday &&
                  'text-muted-foreground',
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>

        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 3).map((user) => (
              <Avatar
                key={user._id}
                className="h-5 w-5 border border-background"
              >
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-[10px]">
                  {user.name?.[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
