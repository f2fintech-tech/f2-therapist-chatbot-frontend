// App metadata
export const APP_NAME = 'F2 Financial Therapist';
export const APP_VERSION = import.meta.env.REACT_APP_VERSION || '1.0.0';
export const APP_ENV = import.meta.env.REACT_APP_ENV || 'development';

// API
export const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
export const API_TIMEOUT = Number(import.meta.env.REACT_APP_API_TIMEOUT) || 30000;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME: 'app-theme',
  AUTH: 'auth-storage',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Chat constants
export const CHAT = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_CONVERSATION_TITLE_LENGTH: 100,
  TYPING_INDICATOR_DELAY: 500,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  MAX_BIO_LENGTH: 500,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  LOGIN: '/login',
  SIGNUP: '/signup',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;

// Theme options
export const THEMES = ['light', 'dark', 'system'] as const;
