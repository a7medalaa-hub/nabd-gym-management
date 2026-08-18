/**
 * coachesApi.js — كل استدعاءات /api/coaches.
 */
window.CoachesAPI = {
  list: () => window.Http.get('/coaches'),
  create: (payload) => window.Http.post('/coaches', payload),
};
