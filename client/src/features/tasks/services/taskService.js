import { apiClient } from '../../../core/api/client.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const taskService = {
  getGrouped: async ({ workspaceId, projectId, filters }) => {
    const res = await apiClient.get(
      ENDPOINTS.tasks.grouped(workspaceId, projectId),
      { params: filters },
    );
    return res.data.data.tasks;
  },

  create: async ({ workspaceId, projectId, data }) => {
    const res = await apiClient.post(
      ENDPOINTS.tasks.create(workspaceId, projectId),
      data,
    );
    return res.data.data.task;
  },

  getById: async ({ workspaceId, taskId }) => {
    const res = await apiClient.get(
      ENDPOINTS.tasks.byId(workspaceId, taskId),
    );
    return res.data.data.task;
  },

  update: async ({ workspaceId, taskId, data }) => {
    const res = await apiClient.patch(
      ENDPOINTS.tasks.update(workspaceId, taskId),
      data,
    );
    return res.data.data.task;
  },

  delete: async ({ workspaceId, taskId }) => {
    await apiClient.delete(ENDPOINTS.tasks.delete(workspaceId, taskId));
  },

  reorder: async ({ workspaceId, updates, projectId }) => {
    await apiClient.post(ENDPOINTS.tasks.reorder(workspaceId), {
      updates,
      projectId,
    });
  },

  search: async ({ workspaceId, query }) => {
    const res = await apiClient.get(ENDPOINTS.tasks.search(workspaceId), {
      params: { q: query },
    });
    return res.data.data.tasks;
  },

  searchPaginated: async ({ workspaceId, query, page = 1, limit = 20 }) => {
    const res = await apiClient.get(
      ENDPOINTS.tasks.searchPaginated(workspaceId),
      { params: { q: query, page, limit } },
    );
    return res.data;
  },
};
