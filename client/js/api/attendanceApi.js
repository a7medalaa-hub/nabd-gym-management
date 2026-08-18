/**
 * attendanceApi.js — كل استدعاءات /api/attendance.
 */
window.AttendanceAPI = {
  checkIn: (memberId) => window.Http.post('/attendance/check-in', { memberId }),
  today: () => window.Http.get('/attendance/today'),
  listByMember: (memberId) => window.Http.get(`/attendance/member/${memberId}`),
};
