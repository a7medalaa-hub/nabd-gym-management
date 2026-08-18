/**
 * authApi.js — كل استدعاءات /api/auth. طبقة رقيقة فوق Http فقط.
 */
window.AuthAPI = {
  login: (username, password) => window.Http.post('/auth/login', { username, password }),
  me: () => window.Http.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    window.Http.post('/auth/change-password', { currentPassword, newPassword }),
};
