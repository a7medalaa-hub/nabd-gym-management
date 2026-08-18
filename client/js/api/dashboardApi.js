/**
 * dashboardApi.js — كل استدعاءات /api/dashboard.
 */
window.DashboardAPI = {
  stats: () => window.Http.get('/dashboard/stats'),
};
