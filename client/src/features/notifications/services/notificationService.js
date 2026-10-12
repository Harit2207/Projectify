import { apiClient } from '../../../core/api/client.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const notificationService = {
  getAll: async (page = 1) => {
    const res = await apiClient.get(ENDPOINTS.notifications.list, {
      params: { page },
    });
    return res.data.data;
  },

  markAsRead: async (notificationId) => {
    const res = await apiClient.patch(
      ENDPOINTS.notifications.markAsRead(notificationId),
    );
    return res.data.data.notification;
  },

  markAllAsRead: async () => {
    await apiClient.patch(ENDPOINTS.notifications.markAllAsRead);
  },
};
