/**
 * expensesApi.js — كل استدعاءات /api/expenses.
 */
window.ExpensesAPI = {
  list: ({ page, limit, from, to } = {}) => window.Http.get('/expenses', { page, limit, from, to }),
  create: (payload) => window.Http.post('/expenses', payload),
  remove: (id) => window.Http.delete(`/expenses/${id}`),
};
