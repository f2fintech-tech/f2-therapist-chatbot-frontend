export const APP_CONFIG = {
  name: import.meta.env.REACT_APP_NAME || 'F2 Therapist Chatbot',
  version: import.meta.env.REACT_APP_VERSION || '1.0.0',
  environment: (import.meta.env.REACT_APP_ENV || 'development') as
    | 'development'
    | 'staging'
    | 'production',

  features: {
    darkMode: import.meta.env.REACT_APP_ENABLE_DARK_MODE !== 'false',
    notifications: import.meta.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',
    analytics: import.meta.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  },

  // Chat config
  chat: {
    maxMessageLength: 2000,
    maxConversationTitleLength: 100,
    messagesPerPage: 50,
  },

  // Auth config
  auth: {
    tokenExpiryBuffer: 60 * 1000, // 1 minute buffer before token expiry
    persistAuth: true,
  },
} as const;

export const isDevelopment = APP_CONFIG.environment === 'development';
export const isProduction = APP_CONFIG.environment === 'production';
