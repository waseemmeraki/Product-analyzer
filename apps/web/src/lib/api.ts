import axios from 'axios';
import type { ApiResponse, LoginRequest, RegisterRequest, DashboardData } from '@product-analytics/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

export const analyticsApi = {
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  trackEvent: async (eventData: any): Promise<ApiResponse> => {
    const response = await apiClient.post('/analytics/events', eventData);
    return response.data;
  },

  getReport: async (type: string): Promise<ApiResponse> => {
    const response = await apiClient.get(`/analytics/reports/${type}`);
    return response.data;
  },
};