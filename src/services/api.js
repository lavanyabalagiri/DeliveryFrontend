import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  me: () => API.get('/auth/me'),
};

export const ordersAPI = {
  estimateAll: (data) => API.post('/orders/estimate/all', data),
  estimate: (data) => API.post('/orders/estimate', data),
  create: (data) => API.post('/orders', data),
  myOrders: () => API.get('/orders/my'),
  driverOrders: () => API.get('/orders/driver'),
  getOrder: (id) => API.get(`/orders/${id}`),
  updateStatus: (id, data) => API.patch(`/orders/${id}/status`, data),
  pay: (id) => API.post(`/orders/${id}/pay`),
};

export const pricingAPI = {
  getMultipliers: () => API.get('/pricing/multipliers'),
};

export const driversAPI = {
  updateAvailability: (data) => API.patch('/drivers/availability', data),
  updateLocation: (data) => API.patch('/drivers/location', data),
};

export default API;
