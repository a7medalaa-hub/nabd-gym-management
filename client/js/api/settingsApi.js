/**
 * settingsApi.js — كل استدعاءات /api/settings.
 */
window.SettingsAPI = {
  getAll: () => window.Http.get('/settings'),
  update: (settings) => window.Http.patch('/settings', { settings }),
};
