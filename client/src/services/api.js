const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const clearAuthToken = () => {
  authToken = null;
};

const buildHeaders = (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
};

const request = async (endpoint, options = {}) => {
  const config = {
    ...options,
    headers: buildHeaders(options.headers),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const isJSON = response.headers.get('content-type')?.includes('application/json');
  const payload = isJSON ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    const message =
      typeof payload === 'string' && payload ? payload : payload?.error || 'Erro inesperado.';
    throw new Error(message);
  }

  return payload;
};

const withParams = (endpoint, params = {}) => {
  const search = new URLSearchParams(params);
  return `${endpoint}${search.toString() ? `?${search.toString()}` : ''}`;
};

export const api = {
  getHealth: () => request('/api/health'),

  // Public data
  getCategories: () => request('/api/categories'),
  getProducts: (params = {}) => request(withParams('/api/products', params)),
  getProductBySlug: (slug) => request(`/api/products/${slug}`),
  getThemes: () => request('/api/themes'),
  getGallery: (params = {}) => request(withParams('/api/gallery', params)),
  getTestimonials: () => request('/api/testimonials'),
  getFaqs: () => request('/api/faqs'),
  getBlogPosts: () => request('/api/blog'),
  getBlogPost: (slug) => request(`/api/blog?slug=${slug}`),
  createOrder: (payload) =>
    request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAccessoryCategories: () => request('/api/accessories/categories'),
  getAccessories: (params = {}) => request(withParams('/api/accessories', params)),
  getAccessoryBySlug: (slug) => request(`/api/accessories/${slug}`),
  createCheckoutSession: (payload) =>
    request('/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPageBySlug: (slug, preview = false) =>
    request(withParams(`/api/pages/${slug}`, preview ? { preview: true } : {})),

  // Auth
  login: ({ email, password }) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getCurrentUser: () => request('/api/auth/me'),

  admin: {
    getSummary: () => request('/api/admin/summary'),
    getOrders: () => request('/api/admin/orders'),
    getOrder: (id) => request(`/api/admin/orders/${id}`),

    categories: {
      list: () => request('/api/admin/categories'),
      create: (payload) =>
        request('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/categories/${id}`, {
          method: 'DELETE',
        }),
    },

    products: {
      list: () => request('/api/admin/products'),
      create: (payload) =>
        request('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/products/${id}`, {
          method: 'DELETE',
        }),
    },

    themes: {
      list: () => request('/api/admin/themes'),
      create: (payload) =>
        request('/api/admin/themes', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/themes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/themes/${id}`, {
          method: 'DELETE',
        }),
    },

    gallery: {
      list: () => request('/api/admin/gallery'),
      create: (payload) =>
        request('/api/admin/gallery', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/gallery/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/gallery/${id}`, {
          method: 'DELETE',
        }),
    },

    blog: {
      list: () => request('/api/admin/blog'),
      create: (payload) =>
        request('/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/blog/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/blog/${id}`, {
          method: 'DELETE',
        }),
    },

    faqs: {
      list: () => request('/api/admin/faqs'),
      create: (payload) =>
        request('/api/admin/faqs', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/faqs/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/faqs/${id}`, {
          method: 'DELETE',
        }),
    },

    pages: {
      list: () => request('/api/admin/pages'),
      get: (id) => request(`/api/admin/pages/${id}`),
      create: (payload) =>
        request('/api/admin/pages', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      update: (id, payload) =>
        request(`/api/admin/pages/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      remove: (id) =>
        request(`/api/admin/pages/${id}`, {
          method: 'DELETE',
        }),
      sections: {
        create: (pageId, payload) =>
          request(`/api/admin/pages/${pageId}/sections`, {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        update: (pageId, sectionId, payload) =>
          request(`/api/admin/pages/${pageId}/sections/${sectionId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          }),
        remove: (pageId, sectionId) =>
          request(`/api/admin/pages/${pageId}/sections/${sectionId}`, {
            method: 'DELETE',
          }),
        move: (pageId, sectionId, direction) =>
          request(`/api/admin/pages/${pageId}/sections/${sectionId}/reorder`, {
            method: 'POST',
            body: JSON.stringify({ direction }),
          }),
      },
      components: {
        create: (pageId, sectionId, payload) =>
          request(`/api/admin/pages/${pageId}/sections/${sectionId}/components`, {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        update: (pageId, sectionId, componentId, payload) =>
          request(
            `/api/admin/pages/${pageId}/sections/${sectionId}/components/${componentId}`,
            {
              method: 'PUT',
              body: JSON.stringify(payload),
            }
          ),
        remove: (pageId, sectionId, componentId) =>
          request(
            `/api/admin/pages/${pageId}/sections/${sectionId}/components/${componentId}`,
            {
              method: 'DELETE',
            }
          ),
        move: (pageId, sectionId, componentId, direction) =>
          request(
            `/api/admin/pages/${pageId}/sections/${sectionId}/components/${componentId}/reorder`,
            {
              method: 'POST',
              body: JSON.stringify({ direction }),
            }
          ),
      },
      versions: {
        list: (pageId) => request(`/api/admin/pages/${pageId}/versions`),
        create: (pageId, payload) =>
          request(`/api/admin/pages/${pageId}/versions`, {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        remove: (pageId, versionId) =>
          request(`/api/admin/pages/${pageId}/versions/${versionId}`, {
            method: 'DELETE',
          }),
        restore: (pageId, versionId) =>
          request(`/api/admin/pages/${pageId}/versions/${versionId}/restore`, {
            method: 'POST',
          }),
      },
    },
  },
};

export default api;
