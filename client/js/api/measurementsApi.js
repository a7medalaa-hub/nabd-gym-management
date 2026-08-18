/**
 * measurementsApi.js — كل استدعاءات /api/measurements.
 */
window.MeasurementsAPI = {
  create: (payload) => window.Http.post('/measurements', payload),
  listByMember: (memberId) => window.Http.get(`/measurements/member/${memberId}`),
};
