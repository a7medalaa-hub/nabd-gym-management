/**
 * workoutPlansApi.js — كل استدعاءات /api/workout-plans.
 */
window.WorkoutPlansAPI = {
  create: (payload) => window.Http.post('/workout-plans', payload),
  current: (memberId) => window.Http.get(`/workout-plans/member/${memberId}/current`),
};
