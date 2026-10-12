import { apiClient } from '../../../core/api/client.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const analyticsService = {
  getWorkspaceStats: async (workspaceId) => {
    const res = await apiClient.get(
      ENDPOINTS.analytics.workspaceStats(workspaceId),
    );
    return res.data.data.stats;
  },

  getProjectStats: async (workspaceId, projectId) => {
    const res = await apiClient.get(
      ENDPOINTS.analytics.projectStats(workspaceId, projectId),
    );
    return res.data.data.stats;
  },
};
