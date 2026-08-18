/**
 * productsApi.js — كل استدعاءات /api/products.
 */
window.ProductsAPI = {
  list: (includeInactive = false) => window.Http.get('/products', { includeInactive }),
};
