import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../shared/components/data-display/StatusBadge.jsx';
import { PriorityIcon } from '../../tasks/components/PriorityIcon.jsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../shared/components/ui/avatar.jsx';

export function SearchResultCard({ task, workspaceId }) {
  const navigate = useNavigate();

  function handleClick() {
    const projectId = task.projectId?._id ?? task.projectId;
    navigate(
      `/workspace/${workspaceId}/board/${projectId}?task=${task._id}`,
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">
            {task.projectId?.emoji} {task.projectId?.name}
          </p>

          <p className="text-sm font-medium truncate">{task.title}</p>

          {task.epicId && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: task.epicId.color }}
              />
              <span className="text-xs text-muted-foreground">
                {task.epicId.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <PriorityIcon priority={task.priority} />
          <StatusBadge status={task.status} />

          {task.assignees?.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 2).map((user) => (
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
    </button>
  );
}
