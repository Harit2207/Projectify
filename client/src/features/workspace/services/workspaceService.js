import { apiClient } from '../../../core/api/client.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const workspaceService = {
  getAll: async () => {
    const res = await apiClient.get(ENDPOINTS.workspace.list);
    return res.data.data.workspaces;
  },

  getById: async (workspaceId) => {
    const res = await apiClient.get(ENDPOINTS.workspace.byId(workspaceId));
    return res.data.data.workspace;
  },

  create: async (data) => {
    const res = await apiClient.post(ENDPOINTS.workspace.create, data);
    return res.data.data.workspace;
  },

  update: async ({ workspaceId, data }) => {
    const res = await apiClient.patch(
      ENDPOINTS.workspace.update(workspaceId),
      data,
    );
    return res.data.data.workspace;
  },

  delete: async (workspaceId) => {
    await apiClient.delete(ENDPOINTS.workspace.delete(workspaceId));
  },

  inviteMember: async ({ workspaceId, data }) => {
    const res = await apiClient.post(
      ENDPOINTS.workspace.invite(workspaceId),
      data,
    );
    return res.data.data.member;
  },

  updateMemberRole: async ({ workspaceId, memberId, role }) => {
    const res = await apiClient.patch(
      ENDPOINTS.workspace.updateMemberRole(workspaceId, memberId),
      { role },
    );
    return res.data.data.member;
  },

  removeMember: async ({ workspaceId, memberId }) => {
    await apiClient.delete(
      ENDPOINTS.workspace.removeMember(workspaceId, memberId),
    );
  },
};
