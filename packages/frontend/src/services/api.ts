import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; displayName: string; handle: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Story API
export const storyApi = {
  create: (data: { title: string; description?: string; privacy?: string }) =>
    api.post('/stories', data),
  getMyStories: () => api.get('/stories/my-stories'),
  getById: (id: string) => api.get(`/stories/${id}`),
  update: (id: string, data: any) => api.patch(`/stories/${id}`, data),
  delete: (id: string) => api.delete(`/stories/${id}`),
  getFeed: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/stories/feed', { params }),
};

// Clip API
export const clipApi = {
  create: (data: any) => api.post('/clips', data),
  update: (id: string, data: any) => api.patch(`/clips/${id}`, data),
  delete: (id: string) => api.delete(`/clips/${id}`),
  reorder: (storyId: string, clipIds: string[]) =>
    api.post(`/clips/reorder/${storyId}`, { clipIds }),
};

// Social API
export const socialApi = {
  toggleLike: (storyId: string) => api.post(`/social/stories/${storyId}/like`),
  getComments: (storyId: string) => api.get(`/social/stories/${storyId}/comments`),
  createComment: (storyId: string, data: { content: string; parentCommentId?: string }) =>
    api.post(`/social/stories/${storyId}/comments`, data),
  deleteComment: (id: string) => api.delete(`/social/comments/${id}`),
  toggleFollow: (userId: string) => api.post(`/social/users/${userId}/follow`),
  getUserProfile: (handle: string) => api.get(`/social/users/${handle}/profile`),
  getNotifications: (unreadOnly?: boolean) =>
    api.get('/social/notifications', { params: { unreadOnly } }),
  markNotificationAsRead: (id: string) =>
    api.patch(`/social/notifications/${id}/read`),
};
