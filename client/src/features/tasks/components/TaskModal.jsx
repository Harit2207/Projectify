import { useState, useEffect } from 'react';
import { Trash2, Loader2, X } from 'lucide-react';
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
} from '../hooks/useTaskQueries.js';
import { useWorkspace } from '../../workspace/hooks/useWorkspaceQueries.js';
import { useEpics } from '../../projects/hooks/useProjectQueries.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { useDebouncedCallback } from '../../../shared/hooks/useDebounce.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '../../../shared/components/ui/dialog.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Input } from '../../../shared/components/ui/input.jsx';
import { Textarea } from '../../../shared/components/ui/textarea.jsx';
import { Badge } from '../../../shared/components/ui/badge.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select.jsx';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../shared/components/ui/avatar.jsx';
import { Separator } from '../../../shared/components/ui/separator.jsx';
import { PriorityIcon } from './PriorityIcon.jsx';
import { formatDate } from '../../../shared/utils/date.js';
import {
  STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '../constants/taskConstants.js';

export function TaskModal({
  workspaceId,
  projectId,
  taskId,
  open,
  onClose,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');

  const { data: task, isLoading } = useTask(workspaceId, taskId);
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: epics } = useEpics(workspaceId, projectId);

  const { mutate: update } = useUpdateTask(workspaceId, projectId);
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask(
    workspaceId,
    projectId,
  );
  const { hasMinRole } = usePermission(workspaceId);
  const { user } = useAuthStore();

  useEffect(() => {
    if (task) {
      setTitleValue(task.title ?? '');
      setDescValue(task.description ?? '');
    }
  }, [task]);

  const currentUserId = user?.id ?? user?._id?.toString();
  const taskCreatorId =
    task?.createdBy?._id?.toString() ??
    task?.createdBy?.id?.toString() ??
    task?.createdBy?.toString();

  const isCreator = currentUserId && taskCreatorId && currentUserId === taskCreatorId;
  const canDeleteTask = hasMinRole('admin') || isCreator;

  function handleUpdate(data) {
    update({ workspaceId, taskId, data });
  }

  // Debounced auto-save for description (700ms pause)
  const debouncedSaveDescription = useDebouncedCallback((val) => {
    if (task && val !== task.description) {
      handleUpdate({ description: val });
    }
  }, 700);

  // Debounced auto-save for title (700ms pause)
  const debouncedSaveTitle = useDebouncedCallback((val) => {
    if (task && val.trim() && val.trim() !== task.title) {
      handleUpdate({ title: val.trim() });
    }
  }, 700);

  function handleTitleSave() {
    if (titleValue.trim() && titleValue !== task?.title) {
      handleUpdate({ title: titleValue.trim() });
    }
    setIsEditingTitle(false);
  }

  function handleDelete() {
    deleteTask({ workspaceId, taskId }, { onSuccess: onClose });
  }

  const currentEpicId = task?.epicId?._id ?? task?.epicId ?? 'none';
  const assignedUsers = task?.assignees ?? [];
  const assignedIds = assignedUsers.map((u) => u._id ?? u.id ?? u.toString());

  // Members not yet assigned
  const availableMembers = (workspace?.members ?? []).filter((m) => {
    const memberUserId = m.userId?._id ?? m.userId?.id ?? m.userId?.toString();
    return !assignedIds.includes(String(memberUserId));
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : task ? (
          <>
            <DialogHeader className="space-y-3 pr-8">
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={titleValue}
                  onChange={(e) => {
                    setTitleValue(e.target.value);
                    debouncedSaveTitle(e.target.value);
                  }}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
                />
              ) : (
                <h2
                  className="text-lg font-semibold cursor-text hover:bg-muted px-1 -mx-1 rounded transition-colors"
                  onClick={() => {
                    setTitleValue(task.title);
                    setIsEditingTitle(true);
                  }}
                >
                  {task.title}
                </h2>
              )}

              {task.epicId && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.epicId.color }}
                  />
                  <span className="text-xs text-muted-foreground font-medium">
                    {task.epicId.title}
                  </span>
                </div>
              )}
            </DialogHeader>

            <div className="grid grid-cols-[1fr_200px] gap-6 mt-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Description
                  </p>
                  <Textarea
                    value={descValue}
                    placeholder="Add a description..."
                    rows={4}
                    className="text-sm resize-none"
                    onChange={(e) => {
                      setDescValue(e.target.value);
                      debouncedSaveDescription(e.target.value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== task.description) {
                        handleUpdate({ description: e.target.value });
                      }
                    }}
                  />
                </div>

                {task.labels?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Labels
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {task.labels.map((label) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Status
                  </p>
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleUpdate({ status: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Priority
                  </p>
                  <Select
                    value={task.priority}
                    onValueChange={(v) => handleUpdate({ priority: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <PriorityIcon priority={p} size="xs" />
                            <span>{PRIORITY_LABELS[p]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Epic Selector (View & Use Epics) */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Epic
                  </p>
                  <Select
                    value={currentEpicId ? String(currentEpicId) : 'none'}
                    onValueChange={(val) =>
                      handleUpdate({ epicId: val === 'none' ? null : val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="No epic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">
                        No epic
                      </SelectItem>
                      {epics?.map((epic) => (
                        <SelectItem key={epic._id} value={epic._id} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: epic.color }}
                            />
                            <span className="truncate">{epic.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignees Selector */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Assignees
                  </p>
                  <div className="space-y-1.5">
                    {assignedUsers.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {assignedUsers.map((u) => {
                          const uId = u._id ?? u.id ?? u;
                          return (
                            <div
                              key={uId}
                              className="flex items-center justify-between gap-1.5 bg-muted/50 rounded px-2 py-1"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Avatar className="h-5 w-5 flex-shrink-0">
                                  <AvatarImage src={u.avatar} />
                                  <AvatarFallback className="text-[10px]">
                                    {u.name?.[0] ?? '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate">
                                  {u.name ?? 'Unknown user'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = assignedUsers
                                    .map((a) => a._id ?? a.id ?? a)
                                    .filter((id) => String(id) !== String(uId));
                                  handleUpdate({ assignees: updated });
                                }}
                                className="text-muted-foreground hover:text-destructive p-0.5"
                                title="Remove assignee"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Unassigned
                      </p>
                    )}

                    {availableMembers.length > 0 && (
                      <Select
                        value=""
                        onValueChange={(selectedUserId) => {
                          if (!selectedUserId) return;
                          const currentIds = assignedUsers.map(
                            (a) => a._id ?? a.id ?? a,
                          );
                          if (!currentIds.includes(selectedUserId)) {
                            handleUpdate({
                              assignees: [...currentIds, selectedUserId],
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs text-muted-foreground border-dashed">
                          <SelectValue placeholder="+ Assign member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMembers.map((m) => {
                            const u = m.userId;
                            const uId = u?._id ?? u?.id ?? u;
                            return (
                              <SelectItem key={uId} value={String(uId)} className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={u?.avatar} />
                                    <AvatarFallback className="text-[9px]">
                                      {u?.name?.[0] ?? '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{u?.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Due date
                  </p>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    min={new Date().toISOString().split('T')[0]}
                    defaultValue={
                      task.dueDate
                        ? new Date(task.dueDate)
                            .toISOString()
                            .split('T')[0]
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const selected = new Date(val);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (selected < today) return;
                      }
                      handleUpdate({
                        dueDate: val
                          ? new Date(val).toISOString()
                          : null,
                      });
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Created by {task.createdBy?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(task.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {canDeleteTask && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete task
                </Button>
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
