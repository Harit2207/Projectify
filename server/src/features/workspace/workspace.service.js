import { sendWorkspaceInviteEmail } from '../../core/services/email.service.js';
import { Workspace } from './workspace.model.js';
import { User } from '../auth/auth.model.js';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../core/errors/errorTypes.js';
import { logger } from '../../core/logger/logger.js';

function generateSlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function createWorkspace(userId, { name, description }) {
  const slug = generateSlug(name);

  const workspace = await Workspace.create({
    name,
    slug,
    description,
    createdBy: userId,
    members: [{ userId, role: 'owner' }],
  });

  logger.info('Workspace created', { workspaceId: workspace._id, userId });
  return workspace;
}

export async function getUserWorkspaces(userId) {
  return Workspace.find({ 'members.userId': userId })
    .select('name slug description logo members createdAt')
    .populate('members.userId', 'name email avatar')
    .sort({ createdAt: -1 });
}

// workspace is already loaded and attached by loadWorkspace middleware
// controller passes req.workspace directly
export function getWorkspace(workspace) {
  return workspace;
}

export async function updateWorkspace(workspace, updates) {
  Object.assign(workspace, updates);
  await workspace.save();
  return workspace;
}

export async function deleteWorkspace(workspace, userId) {
  if (workspace.getMemberRole(userId) !== 'owner') {
    throw new ForbiddenError('Only the owner can delete this workspace');
  }
  await workspace.deleteOne();
  logger.info('Workspace deleted', { workspaceId: workspace._id, userId });
}

export async function inviteMember(workspace, { email, role }) {
  const userToInvite = await User.findOne({ email });
  if (!userToInvite) {
    throw new NotFoundError('No account found with that email');
  }

  if (workspace.isMember(userToInvite._id)) {
    throw new ConflictError('User is already a member of this workspace');
  }

  workspace.members.push({ userId: userToInvite._id, role });
  await workspace.save();

  // Non-blocking background workspace invite email dispatch
  sendWorkspaceInviteEmail({
    to: userToInvite.email,
    userName: userToInvite.name || 'Teammate',
    workspaceName: workspace.name,
    role,
  });

  logger.info('Member invited', {
    workspaceId: workspace._id,
    invitedUserId: userToInvite._id,
    role,
  });

  return {
    userId: userToInvite.toSafeObject ? userToInvite.toSafeObject() : {
      id: userToInvite._id,
      name: userToInvite.name,
      email: userToInvite.email,
      avatar: userToInvite.avatar,
    },
    role,
    joinedAt: new Date(),
  };
}

export async function updateMemberRole(workspace, memberId, newRole, requesterId) {
  //debug
   console.log('URL memberId:', memberId);

  console.log(
    'Workspace members:',
    workspace.members.map((m) => ({
      userId: m.userId,
      userIdString: m.userId?.toString(),
      role: m.role,
    })),
  );
  
  const targetMember = workspace.members.find(
    (m) => m.userId.toString() === memberId,
  );

  if (!targetMember) throw new NotFoundError('Member not found in workspace');

  if (targetMember.role === 'owner') {
    throw new ForbiddenError('Cannot change the role of the workspace owner');
  }

  if (memberId === requesterId.toString()) {
    throw new BadRequestError('You cannot change your own role');
  }

  targetMember.role = newRole;
  await workspace.save();
  return targetMember;
}

export async function removeMember(workspace, memberId, requesterId) {
  const targetMember = workspace.members.find(
    (m) => m.userId.toString() === memberId,
  );

  if (!targetMember) throw new NotFoundError('Member not found in workspace');

  if (targetMember.role === 'owner') {
    throw new ForbiddenError('Cannot remove the workspace owner');
  }

  const requesterRole = workspace.getMemberRole(requesterId);
  const isSelf = memberId === requesterId.toString();

  if (!isSelf && !['owner', 'admin'].includes(requesterRole)) {
    throw new ForbiddenError('You do not have permission to remove members');
  }

  workspace.members = workspace.members.filter(
    (m) => m.userId.toString() !== memberId,
  );

  await workspace.save();
  logger.info('Member removed', { workspaceId: workspace._id, memberId });
}
