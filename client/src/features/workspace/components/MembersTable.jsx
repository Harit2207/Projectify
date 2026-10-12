import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Shield, UserMinus, LogOut } from 'lucide-react';
import {
  useUpdateMemberRole,
  useRemoveMember,
} from '../hooks/useWorkspaceQueries.js';
import { useAuthStore } from '../../../core/store/authStore.js';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar.jsx';
import { Badge } from '../../../shared/components/ui/badge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../shared/components/ui/dropdown-menu.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { ConfirmDialog } from '../../../shared/components/modals/ConfirmDialog.jsx';

const ROLE_BADGE = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
};

export function MembersTable({ members, workspaceId }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hasMinRole, isOwner } = usePermission(workspaceId);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const { mutate: updateRole } = useUpdateMemberRole();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember();

  const currentUserId = user?.id ?? user?._id?.toString();
  const currentUserRole = members?.find((m) => {
    const memberUserId = m.userId?._id?.toString() ?? m.userId?.id?.toString() ?? m.userId?.toString();
    return String(memberUserId) === String(currentUserId);
  })?.role;

  const isUserOwner = currentUserRole === 'owner' || isOwner();
  const canManage = isUserOwner || currentUserRole === 'admin' || hasMinRole('admin');

  function handleLeave() {
    removeMember(
      { workspaceId, memberId: currentUserId },
      {
        onSuccess: () => {
          setShowLeaveConfirm(false);
          navigate('/workspaces');
        },
      },
    );
  }

  return (
    <div className="border rounded-lg divide-y">
      {members.map((member) => {
        const memberUser = member.userId;
        const memberId = memberUser?._id ?? memberUser?.id;
        const isCurrentUser = String(memberId) === String(currentUserId);
        const initials = memberUser?.name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase() ?? '?';

        return (
          <div
            key={memberId}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={memberUser?.avatar} alt={memberUser?.name} />
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {memberUser?.name}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {memberUser?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={ROLE_BADGE[member.role]}>{member.role}</Badge>

              {/* Action menu for managing other members (Owner & Admin only) */}
              {canManage && member.role !== 'owner' && !isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === 'member' && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateRole({
                            workspaceId,
                            memberId,
                            role: 'admin',
                          })
                        }
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Make admin
                      </DropdownMenuItem>
                    )}
                    {member.role === 'admin' && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateRole({
                            workspaceId,
                            memberId,
                            role: 'member',
                          })
                        }
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Make member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setRemoveTarget(member)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Leave workspace action for current user (if not owner) */}
              {isCurrentUser && !isUserOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive text-xs gap-1 h-8"
                  onClick={() => setShowLeaveConfirm(true)}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Leave
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Dialog to remove another member */}
      <ConfirmDialog
        open={!!removeTarget}
        title="Remove member"
        description={`Remove ${removeTarget?.userId?.name} from this workspace?`}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={isRemoving}
        onConfirm={() =>
          removeMember(
            {
              workspaceId,
              memberId: removeTarget.userId._id ?? removeTarget.userId.id,
            },
            { onSuccess: () => setRemoveTarget(null) },
          )
        }
        onCancel={() => setRemoveTarget(null)}
      />

      {/* Dialog for current user leaving workspace */}
      <ConfirmDialog
        open={showLeaveConfirm}
        title="Leave workspace"
        description="Are you sure you want to leave this workspace? You will lose access to all its projects and tasks."
        confirmLabel="Leave workspace"
        variant="destructive"
        isLoading={isRemoving}
        onConfirm={handleLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
