import { useAuthStore } from '../../../core/store/authStore.js';
import { MoreHorizontal, Settings, Trash2, Users, LogOut } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../shared/components/ui/dropdown-menu.jsx';

export function WorkspaceCard({
  workspace,
  onSelect,
  onSettings,
  onDelete,
  onLeave,
}) {
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? user?._id?.toString();
  const userMember = workspace.members?.find(
    (m) =>
      String(m.userId?._id ?? m.userId?.toString()) ===
      String(currentUserId),
  );
  const userRole = userMember?.role;
  const isOwner = userRole === 'owner';
  const canManage = isOwner || userRole === 'admin';

  const initials = workspace.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="group cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{workspace.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {workspace.description || 'No description'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              {canManage && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              )}

              {!isOwner && onLeave && (
                <DropdownMenuItem
                  onClick={onLeave}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave workspace
                </DropdownMenuItem>
              )}

              {isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {workspace.members?.length ?? 0}{' '}
            {workspace.members?.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
