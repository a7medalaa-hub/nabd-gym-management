/**
 * dietPlansApi.js — كل استدعاءات /api/diet-plans.
 */
window.DietPlansAPI = {
  create: (payload) => window.Http.post('/diet-plans', payload),
  current: (memberId) => window.Http.get(`/diet-plans/member/${memberId}/current`),
};
