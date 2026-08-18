/**
 * notificationsApi.js — كل استدعاءات /api/notifications.
 */
window.NotificationsAPI = {
  list: () => window.Http.get('/notifications', { limit: 20 }),
  markRead: (id) => window.Http.patch(`/notifications/${id}/read`),
};
