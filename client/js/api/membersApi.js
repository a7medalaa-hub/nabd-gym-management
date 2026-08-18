/**
 * membersApi.js — كل استدعاءات /api/members.
 */
window.MembersAPI = {
  list: ({ page, limit, search, status } = {}) => window.Http.get('/members', { page, limit, search, status }),
  getById: (id) => window.Http.get(`/members/${id}`),
  create: (payload) => window.Http.post('/members', payload),
  update: (id, payload) => window.Http.patch(`/members/${id}`, payload),
  remove: (id) => window.Http.delete(`/members/${id}`),
};
