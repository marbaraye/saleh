import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  Module,
  Topic,
  Project,
  Badge,
  Progress,
  Leaderboard,
  SubmissionResult,
  Submission,
} from '../types';

// Configuration de base
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Instance Axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            const { token } = response.data;
            
            localStorage.setItem('token', token);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            
            return api(originalRequest);
          }
        } catch {
          // Refresh token invalide, déconnexion
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTIFICATION
// ============================================

export const authApi = {
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post<{ user: User; token: string; refreshToken: string }>(
      '/auth/register',
      credentials
    );
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post<{ user: User; token: string; refreshToken: string }>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
};

// ============================================
// UTILISATEURS
// ============================================

export const usersApi = {
  getProfile: async () => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { username?: string; bio?: string; avatarUrl?: string }) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  updatePreferences: async (preferences: Record<string, unknown>) => {
    const response = await api.put('/users/preferences', { preferences });
    return response.data;
  },

  getPublicProfile: async (username: string) => {
    const response = await api.get<User>(`/users/${username}`);
    return response.data;
  },

  getUserActivity: async (username: string) => {
    const response = await api.get(`/users/${username}/activity`);
    return response.data;
  },
};

// ============================================
// MODULES
// ============================================

export const modulesApi = {
  getAll: async () => {
    const response = await api.get<Module[]>('/modules');
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await api.get<Module & { topics: Topic[] }>(`/modules/${slug}`);
    return response.data;
  },

  getStats: async (slug: string) => {
    const response = await api.get(`/modules/${slug}/stats`);
    return response.data;
  },
};

// ============================================
// TOPICS
// ============================================

export const topicsApi = {
  getAll: async (params?: { module?: string; difficulty?: number; status?: string }) => {
    const response = await api.get<Topic[]>('/topics', { params });
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await api.get<Topic>(`/topics/${slug}`);
    return response.data;
  },

  getContent: async (slug: string) => {
    const response = await api.get(`/topics/${slug}/content`);
    return response.data;
  },
};

// ============================================
// PROJETS
// ============================================

export const projectsApi = {
  getAll: async (params?: { difficulty?: number; module?: string }) => {
    const response = await api.get<Project[]>('/projects', { params });
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await api.get<Project>(`/projects/${slug}`);
    return response.data;
  },

  submit: async (slug: string, code: string) => {
    const response = await api.post<SubmissionResult>(`/projects/${slug}/submit`, { code });
    return response.data;
  },

  getSubmissions: async (slug: string) => {
    const response = await api.get<Submission[]>(`/projects/${slug}/submissions`);
    return response.data;
  },

  getHint: async (slug: string, index: number) => {
    const response = await api.get<{ hint: string; index: number; totalHints: number }>(
      `/projects/${slug}/hint/${index}`
    );
    return response.data;
  },
};

// ============================================
// PROGRESSION
// ============================================

export const progressApi = {
  getAll: async () => {
    const response = await api.get<Progress>('/progress');
    return response.data;
  },

  getTopicProgress: async (topicId: string) => {
    const response = await api.get(`/progress/topic/${topicId}`);
    return response.data;
  },

  startTopic: async (topicId: string) => {
    const response = await api.post(`/progress/topic/${topicId}/start`);
    return response.data;
  },

  completeTopic: async (topicId: string) => {
    const response = await api.post(`/progress/topic/${topicId}/complete`);
    return response.data;
  },

  updateNotes: async (topicId: string, notes: string) => {
    const response = await api.put(`/progress/topic/${topicId}/notes`, { notes });
    return response.data;
  },

  toggleBookmark: async (topicId: string, bookmarked: boolean) => {
    const response = await api.put(`/progress/topic/${topicId}/bookmark`, { bookmarked });
    return response.data;
  },

  updateTime: async (topicId: string, minutes: number) => {
    const response = await api.put(`/progress/topic/${topicId}/time`, { minutes });
    return response.data;
  },

  getStreak: async () => {
    const response = await api.get('/progress/streak');
    return response.data;
  },

  recordActivity: async () => {
    const response = await api.post('/progress/activity');
    return response.data;
  },
};

// ============================================
// BADGES
// ============================================

export const badgesApi = {
  getAll: async () => {
    const response = await api.get<Badge[]>('/badges');
    return response.data;
  },

  getUserBadges: async () => {
    const response = await api.get<Badge[]>('/badges/user');
    return response.data;
  },

  checkNewBadges: async () => {
    const response = await api.get<{ newBadges: Badge[]; message: string }>('/badges/check');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Badge>(`/badges/${id}`);
    return response.data;
  },
};

// ============================================
// LEADERBOARD
// ============================================

export const leaderboardApi = {
  getGlobal: async (limit = 50, offset = 0) => {
    const response = await api.get<Leaderboard>('/leaderboard', { params: { limit, offset } });
    return response.data;
  },

  getWeekly: async () => {
    const response = await api.get('/leaderboard/weekly');
    return response.data;
  },

  getByModule: async (moduleSlug: string) => {
    const response = await api.get(`/leaderboard/module/${moduleSlug}`);
    return response.data;
  },

  getStreaks: async () => {
    const response = await api.get('/leaderboard/streaks');
    return response.data;
  },

  getAroundMe: async () => {
    const response = await api.get('/leaderboard/around-me');
    return response.data;
  },
};

export default api;
