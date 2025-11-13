import axios from 'axios';
import type {
  CreateCharacterRefRequest,
  CreateGarmentRefRequest,
  CreateStyleRefRequest,
  UpdateCharacterRefRequest,
  UpdateGarmentRefRequest,
  UpdateStyleRefRequest,
  UpdateGenerationFeedbackRequest,
} from '../types/reference';

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

// Photo Session API
export const photoSessionApi = {
  createSession: (data: { title: string }) =>
    api.post('/photo/sessions', data),
  getUserSessions: () => api.get('/photo/sessions'),
  getSession: (sessionId: string) => api.get(`/photo/sessions/${sessionId}`),
  uploadPhoto: (sessionId: string, file: File, subType: 'PRODUCT' | 'MODEL') => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('subType', subType);
    return api.post(`/photo/sessions/${sessionId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  applyVirtualTryOn: (sessionId: string, data: { productAssetId: string; modelAssetId: string }) =>
    api.post(`/photo/sessions/${sessionId}/try-on`, data),
  generateVariations: (sessionId: string, data: { baseAssetId: string; mood?: string; framing?: string; count?: number }) =>
    api.post(`/photo/sessions/${sessionId}/variations`, data),
  upscaleImage: (sessionId: string, data: { assetId: string; factor?: number }) =>
    api.post(`/photo/sessions/${sessionId}/upscale`, data),
  createAnimation: (sessionId: string, data: { assetIds: string[]; duration?: number; style?: string }) =>
    api.post(`/photo/sessions/${sessionId}/animate`, data),
};

// Reference API
export const referenceApi = {
  // ============================================================
  // CHARACTER REFERENCE
  // ============================================================

  createCharacter: (data: CreateCharacterRefRequest) => {
    const formData = new FormData();
    formData.append('sessionId', data.sessionId);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('image', data.image);

    return api.post('/references/character', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getCharacters: (sessionId: string, activeOnly = false) =>
    api.get(`/references/character/session/${sessionId}`, {
      params: { activeOnly },
    }),

  getCharacter: (id: string) =>
    api.get(`/references/character/${id}`),

  updateCharacter: (id: string, data: UpdateCharacterRefRequest) =>
    api.put(`/references/character/${id}`, data),

  deleteCharacter: (id: string) =>
    api.delete(`/references/character/${id}`),

  // ============================================================
  // GARMENT REFERENCE
  // ============================================================

  createGarment: (data: CreateGarmentRefRequest) => {
    const formData = new FormData();
    formData.append('sessionId', data.sessionId);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    formData.append('image', data.image);

    return api.post('/references/garment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getGarments: (sessionId: string, activeOnly = false) =>
    api.get(`/references/garment/session/${sessionId}`, {
      params: { activeOnly },
    }),

  updateGarment: (id: string, data: UpdateGarmentRefRequest) =>
    api.put(`/references/garment/${id}`, data),

  deleteGarment: (id: string) =>
    api.delete(`/references/garment/${id}`),

  // ============================================================
  // STYLE REFERENCE
  // ============================================================

  createStyle: (data: CreateStyleRefRequest) => {
    const formData = new FormData();
    formData.append('sessionId', data.sessionId);
    formData.append('type', data.type);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('promptTemplate', data.promptTemplate);
    if (data.negativePrompt) formData.append('negativePrompt', data.negativePrompt);
    if (data.lightingSetup) formData.append('lightingSetup', data.lightingSetup);
    if (data.mood) formData.append('mood', data.mood);
    if (data.cameraAngle) formData.append('cameraAngle', data.cameraAngle);
    if (data.image) formData.append('image', data.image);

    return api.post('/references/style', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getStyles: (sessionId: string, type?: string, activeOnly = false) =>
    api.get(`/references/style/session/${sessionId}`, {
      params: { type, activeOnly },
    }),

  updateStyle: (id: string, data: UpdateStyleRefRequest) =>
    api.put(`/references/style/${id}`, data),

  deleteStyle: (id: string) =>
    api.delete(`/references/style/${id}`),

  // ============================================================
  // COMBINED & UTILITY
  // ============================================================

  autoExtract: (image: File) => {
    const formData = new FormData();
    formData.append('image', image);

    return api.post('/references/auto-extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getSessionReferences: (sessionId: string, activeOnly = false) =>
    api.get(`/references/session/${sessionId}`, {
      params: { activeOnly },
    }),

  getSessionStats: (sessionId: string) =>
    api.get(`/references/session/${sessionId}/stats`),

  // ============================================================
  // GENERATION HISTORY & ANALYTICS
  // ============================================================

  getGenerationHistory: (sessionId: string, limit = 50) =>
    api.get(`/references/session/${sessionId}/history`, {
      params: { limit },
    }),

  getGenerationAnalytics: (sessionId: string) =>
    api.get(`/references/session/${sessionId}/analytics`),

  updateGenerationFeedback: (historyId: string, data: UpdateGenerationFeedbackRequest) =>
    api.put(`/references/history/${historyId}/feedback`, data),
};
