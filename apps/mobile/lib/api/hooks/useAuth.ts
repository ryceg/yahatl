/**
 * Auth API Hooks
 *
 * TanStack Query hooks for authentication operations.
 * These provide an alternative to using the authStore directly.
 */
import { useMutation } from '@tanstack/react-query';
import { login as apiLogin, setAccessToken, AuthResponse, API_BASE_URL } from '../api';
import { queryClient } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import * as tokenStorage from '../../services/tokenStorage';

export { API_BASE_URL };

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Hook for user login.
 *
 * On success, stores tokens in auth store and secure storage.
 */
export function useLogin() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (request: LoginRequest) => {
      return apiLogin(request.email, request.password);
    },
    onSuccess: async (data: AuthResponse) => {
      if (data.accessToken) {
        // Set token for API client
        setAccessToken(data.accessToken);
        // Store tokens in secure storage and auth store
        await tokenStorage.saveTokens(data.accessToken, data.refreshToken ?? '');
        setTokens(data.accessToken, data.refreshToken ?? null);
        setUser({
          id: data.userId,
          email: data.email,
          name: data.email.split('@')[0],
        });
      }
    },
  });
}

/**
 * Hook for user logout.
 *
 * Clears all auth state and query cache.
 */
export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      // Clear all query cache on logout
      queryClient.clear();
      await logout();
    },
  });
}
