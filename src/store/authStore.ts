import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { AuthState, AuthTokens, AuthUser, LoginCredentials, SignupCredentials } from '../types/auth';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.login(credentials);
            set({
              user: response.data.user,
              tokens: response.data.tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (err) {
            set({
              error: (err as { message: string }).message,
              isLoading: false,
              isAuthenticated: false,
            });
            throw err;
          }
        },

        signup: async (credentials: SignupCredentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.signup(credentials);
            set({
              user: response.data.user,
              tokens: response.data.tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (err) {
            set({
              error: (err as { message: string }).message,
              isLoading: false,
              isAuthenticated: false,
            });
            throw err;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await authService.logout();
          } finally {
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        fetchCurrentUser: async () => {
          set({ isLoading: true });
          try {
            const response = await authService.getCurrentUser();
            set({ user: response.data, isAuthenticated: true, isLoading: false });
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },

        setUser: (user: AuthUser) => set({ user, isAuthenticated: true }),

        setTokens: (tokens: AuthTokens) => set({ tokens }),

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: 'AuthStore' }
  )
);
