/**
 * salesApi.js — كل استدعاءات /api/sales.
 */
window.SalesAPI = {
  create: (payload) => window.Http.post('/sales', payload),
  todaySummary: () => window.Http.get('/sales/today-summary'),
};
