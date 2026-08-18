/**
 * subscriptionTypesApi.js — كل استدعاءات /api/subscription-types.
 */
window.SubscriptionTypesAPI = {
  list: () => window.Http.get('/subscription-types'),
};
