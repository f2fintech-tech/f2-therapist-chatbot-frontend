import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { userService } from '../services/userService';
import { UpdatePreferencesPayload, UpdateProfilePayload, UserProfile } from '../types/user';

interface UserStore {
  profile: UserProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updatePreferences: (payload: UpdatePreferencesPayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      profile: null,
      isLoading: false,
      isUpdating: false,
      error: null,

      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await userService.getProfile();
          set({ profile: response.data, isLoading: false });
        } catch (err) {
          set({ error: (err as { message: string }).message, isLoading: false });
        }
      },

      updateProfile: async (payload: UpdateProfilePayload) => {
        set({ isUpdating: true, error: null });
        try {
          const response = await userService.updateProfile(payload);
          set({ profile: response.data, isUpdating: false });
        } catch (err) {
          set({ error: (err as { message: string }).message, isUpdating: false });
          throw err;
        }
      },

      updatePreferences: async (payload: UpdatePreferencesPayload) => {
        set({ isUpdating: true, error: null });
        try {
          const response = await userService.updatePreferences(payload);
          set({ profile: response.data, isUpdating: false });
        } catch (err) {
          set({ error: (err as { message: string }).message, isUpdating: false });
          throw err;
        }
      },

      uploadAvatar: async (file: File) => {
        set({ isUpdating: true, error: null });
        try {
          const response = await userService.uploadAvatar(file);
          set((state) => ({
            profile: state.profile
              ? { ...state.profile, avatarUrl: response.data.avatarUrl }
              : null,
            isUpdating: false,
          }));
        } catch (err) {
          set({ error: (err as { message: string }).message, isUpdating: false });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'UserStore' }
  )
);
