export const ENDPOINTS = {
  auth: {
    me: '/api/auth/me',
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    googleCallback: '/api/auth/google/callback',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  workspace: {
    list: '/api/workspaces',
    create: '/api/workspaces',
    byId: (id) => `/api/workspaces/${id}`,
    update: (id) => `/api/workspaces/${id}`,
    delete: (id) => `/api/workspaces/${id}`,
    members: (id) => `/api/workspaces/${id}/members`,
    invite: (id) => `/api/workspaces/${id}/members/invite`,
    updateMemberRole: (workspaceId, memberId) =>
      `/api/workspaces/${workspaceId}/members/${memberId}/role`,
    removeMember: (workspaceId, memberId) =>
      `/api/workspaces/${workspaceId}/members/${memberId}`,
  },
  projects: {
    list: (workspaceId) => `/api/workspaces/${workspaceId}/projects`,
    create: (workspaceId) => `/api/workspaces/${workspaceId}/projects`,
    byId: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/projects/${projectId}`,
  },
  epics: {
    list: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/projects/${projectId}/epics`,
    create: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/projects/${projectId}/epics`,
    byId: (workspaceId, projectId, epicId) =>
      `/api/workspaces/${workspaceId}/projects/${projectId}/epics/${epicId}`,
  },
  tasks: {
    list: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/${projectId}/tasks`,
    grouped: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/${projectId}/tasks/grouped`,
    create: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/${projectId}/tasks`,
    byId: (workspaceId, taskId) =>
      `/api/workspaces/${workspaceId}/tasks/${taskId}`,
    update: (workspaceId, taskId) =>
      `/api/workspaces/${workspaceId}/tasks/${taskId}`,
    delete: (workspaceId, taskId) =>
      `/api/workspaces/${workspaceId}/tasks/${taskId}`,
    reorder: (workspaceId) =>
      `/api/workspaces/${workspaceId}/tasks/reorder`,
    search: (workspaceId) =>
      `/api/workspaces/${workspaceId}/tasks/search`,
    searchPaginated: (workspaceId) =>
      `/api/workspaces/${workspaceId}/tasks/search/paginated`,
  },
  analytics: {
    workspaceStats: (workspaceId) =>
      `/api/workspaces/${workspaceId}/stats`,
    projectStats: (workspaceId, projectId) =>
      `/api/workspaces/${workspaceId}/projects/${projectId}/stats`,
  },
  notifications: {
    list: '/api/notifications',
    markAsRead: (id) => `/api/notifications/${id}/read`,
    markAllAsRead: '/api/notifications/read-all',
  },
};
