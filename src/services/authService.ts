import apiClient, { clearAuthTokens, setAuthTokens } from './api';
import { ApiResponse } from '../types/api';
import {
  AuthTokens,
  AuthUser,
  LoginCredentials,
  PasswordResetPayload,
  PasswordResetRequest,
  SignupCredentials,
} from '../types/auth';

interface AuthResponseData {
  user: AuthUser;
  tokens: AuthTokens;
}

export const authService = {
  /**
   * Log in with email and password
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponseData>> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      credentials
    );
    if (data.data?.tokens) {
      setAuthTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    }
    return data;
  },

  /**
   * Register a new user account
   */
  signup: async (credentials: SignupCredentials): Promise<ApiResponse<AuthResponseData>> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/signup',
      credentials
    );
    if (data.data?.tokens) {
      setAuthTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    }
    return data;
  },

  /**
   * Log out the current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuthTokens();
    }
  },

  /**
   * Get the currently authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<AuthUser>> => {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return data;
  },

  /**
   * Request a password reset email
   */
  requestPasswordReset: async (payload: PasswordResetRequest): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', payload);
    return data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (payload: PasswordResetPayload): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post<ApiResponse<void>>('/auth/reset-password', payload);
    return data;
  },
};
