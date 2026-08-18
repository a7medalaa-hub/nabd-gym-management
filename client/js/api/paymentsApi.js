/**
 * paymentsApi.js — كل استدعاءات /api/payments.
 */
window.PaymentsAPI = {
  list: ({ page, limit, from, to, memberId } = {}) => window.Http.get('/payments', { page, limit, from, to, memberId }),
  todaySummary: () => window.Http.get('/payments/today-summary'),
};
