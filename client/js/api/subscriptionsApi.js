/**
 * subscriptionsApi.js — كل استدعاءات /api/subscriptions.
 */
window.SubscriptionsAPI = {
  expiringSoon: (withinDays = 10) => window.Http.get('/subscriptions/expiring-soon', { withinDays }),
  listByMember: (memberId) => window.Http.get(`/subscriptions/member/${memberId}`),
  renew: (memberId, { subscriptionTypeId, paymentMethod }) =>
    window.Http.post(`/subscriptions/member/${memberId}/renew`, { subscriptionTypeId, paymentMethod }),
};
