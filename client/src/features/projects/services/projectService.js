import { apiClient } from '../../../core/api/client.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const projectService = {
  getAll: async (workspaceId) => {
    const res = await apiClient.get(ENDPOINTS.projects.list(workspaceId));
    return res.data.data.projects;
  },

  getById: async ({ workspaceId, projectId }) => {
    const res = await apiClient.get(
      ENDPOINTS.projects.byId(workspaceId, projectId),
    );
    return res.data.data.project;
  },

  create: async ({ workspaceId, data }) => {
    const res = await apiClient.post(
      ENDPOINTS.projects.create(workspaceId),
      data,
    );
    return res.data.data.project;
  },

  update: async ({ workspaceId, projectId, data }) => {
    const res = await apiClient.patch(
      ENDPOINTS.projects.byId(workspaceId, projectId),
      data,
    );
    return res.data.data.project;
  },

  delete: async ({ workspaceId, projectId }) => {
    await apiClient.delete(ENDPOINTS.projects.byId(workspaceId, projectId));
  },

  getEpics: async ({ workspaceId, projectId }) => {
    const res = await apiClient.get(
      ENDPOINTS.epics.list(workspaceId, projectId),
    );
    return res.data.data.epics;
  },

  createEpic: async ({ workspaceId, projectId, data }) => {
    const res = await apiClient.post(
      ENDPOINTS.epics.create(workspaceId, projectId),
      data,
    );
    return res.data.data.epic;
  },

  updateEpic: async ({ workspaceId, projectId, epicId, data }) => {
    const res = await apiClient.patch(
      ENDPOINTS.epics.byId(workspaceId, projectId, epicId),
      data,
    );
    return res.data.data.epic;
  },

  deleteEpic: async ({ workspaceId, projectId, epicId }) => {
    await apiClient.delete(
      ENDPOINTS.epics.byId(workspaceId, projectId, epicId),
    );
  },
};
