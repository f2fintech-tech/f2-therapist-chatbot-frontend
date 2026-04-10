import apiClient from './api';
import { ApiResponse } from '../types/api';
import { UpdatePreferencesPayload, UpdateProfilePayload, UserProfile } from '../types/user';

export const userService = {
  /**
   * Get the current user's profile
   */
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const { data } = await apiClient.get<ApiResponse<UserProfile>>('/users/profile');
    return data;
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<UserProfile>> => {
    const { data } = await apiClient.patch<ApiResponse<UserProfile>>('/users/profile', payload);
    return data;
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (
    payload: UpdatePreferencesPayload
  ): Promise<ApiResponse<UserProfile>> => {
    const { data } = await apiClient.patch<ApiResponse<UserProfile>>(
      '/users/preferences',
      payload
    );
    return data;
  },

  /**
   * Upload a profile avatar image
   */
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/users/avatar',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data;
  },

  /**
   * Delete user account
   */
  deleteAccount: async (): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete<ApiResponse<void>>('/users/profile');
    return data;
  },
};
