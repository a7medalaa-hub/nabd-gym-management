/**
 * backupsApi.js — كل استدعاءات /api/backups.
 */
window.BackupsAPI = {
  create: () => window.Http.post('/backups'),
  list: () => window.Http.get('/backups'),
  restore: (filename) => window.Http.post('/backups/restore', { filename }),
};
