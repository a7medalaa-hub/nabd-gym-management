/**
 * reportsApi.js — كل استدعاءات /api/reports.
 */
window.ReportsAPI = {
  summary: (from, to) => window.Http.get('/reports/summary', { from, to }),
};
