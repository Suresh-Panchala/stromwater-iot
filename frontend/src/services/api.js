import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry login/register requests
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        // Only try to refresh if we have a refresh token
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (passwords) => api.post('/users/change-password', passwords),
};

// Device API
export const deviceAPI = {
  getDevices: () => api.get('/devices'),
  getDeviceById: (deviceId) => api.get(`/devices/${deviceId}`),
  getDeviceData: (deviceId, params) => api.get(`/devices/${deviceId}/data`, { params }),
  getLatestData: (deviceId) => api.get(`/devices/${deviceId}/latest`),
  getHistoricalData: (deviceId, hours = 24) => api.get(`/devices/${deviceId}/historical`, { params: { hours } }),
  getDeviceStats: (deviceId, hours = 24) => api.get(`/devices/${deviceId}/stats`, { params: { hours } }),
  exportCSV: (deviceId, params) => api.get(`/devices/${deviceId}/export/csv`, { params, responseType: 'blob' }),
  exportPDF: (deviceId, params) => api.get(`/devices/${deviceId}/export/pdf`, { params, responseType: 'blob' }),
};

// Alert API
export const alertAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  acknowledgeAlert: (alertId) => api.put(`/alerts/${alertId}/acknowledge`),
};

// User API (Admin only)
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

export default api;
