import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const cleanBaseUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
const API_URL = `${cleanBaseUrl}/api`;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const restaurantApi = {
  get: (slug) => api.get(`/restaurants/${slug}`),
  getMenu: (slug) => api.get(`/restaurants/${slug}/menu`),
  getTable: (slug, tableNumber) => api.get(`/restaurants/${slug}/table/${tableNumber}`),
};

export const ordersApi = {
  place: (data) => api.post('/orders', data),
  track: (orderId) => api.get(`/orders/${orderId}`),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getRestaurant: () => api.get('/admin/restaurant'),
  updateRestaurant: (data) => api.patch('/admin/restaurant', data),

  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  getMenu: () => api.get('/admin/menu'),
  createMenuItem: (data) => api.post('/admin/menu', data),
  updateMenuItem: (id, data) => api.put(`/admin/menu/${id}`, data),
  toggleAvailability: (id, isAvailable) => api.patch(`/admin/menu/${id}/availability`, { isAvailable }),
  deleteMenuItem: (id) => api.delete(`/admin/menu/${id}`),

  getTables: () => api.get('/admin/tables'),
  createTable: (data) => api.post('/admin/tables', data),
  updateTable: (id, data) => api.put(`/admin/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/admin/tables/${id}`),

  getOrders: (params) => api.get('/admin/orders', { params }),
};

export const kitchenApi = {
  getOrders: () => api.get('/kitchen/orders'),
  updateStatus: (id, status) => api.patch(`/kitchen/orders/${id}/status`, { status }),
};
