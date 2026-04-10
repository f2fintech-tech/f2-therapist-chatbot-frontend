export const API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export const API_TIMEOUT = Number(import.meta.env.REACT_APP_API_TIMEOUT) || 30000;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // Chat
  CHAT: {
    MESSAGE: '/chat/message',
    CONVERSATIONS: '/conversations',
    CONVERSATION: (id: string) => `/conversations/${id}`,
    MESSAGES: (id: string) => `/conversations/${id}/messages`,
  },
  // Users
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    AVATAR: '/users/avatar',
  },
} as const;
