import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoginCredentials, SignupCredentials } from '../types/auth';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, login, signup, logout, clearError } =
    useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        await login(credentials);
        navigate('/chat');
      } catch {
        // Error is set in store; component will display it
      }
    },
    [login, navigate]
  );

  const handleSignup = useCallback(
    async (credentials: SignupCredentials) => {
      try {
        await signup(credentials);
        navigate('/chat');
      } catch {
        // Error is set in store; component will display it
      }
    },
    [signup, navigate]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    clearError,
  };
};
