/**
 * weightLogsApi.js — كل استدعاءات /api/weight-logs.
 */
window.WeightLogsAPI = {
  create: (payload) => window.Http.post('/weight-logs', payload),
  listByMember: (memberId) => window.Http.get(`/weight-logs/member/${memberId}`),
};
