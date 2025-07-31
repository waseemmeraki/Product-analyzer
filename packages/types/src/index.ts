export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId: string;
  projectId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardData {
  totalEvents: number;
  totalUsers: number;
  totalProjects: number;
  recentEvents: Event[];
}