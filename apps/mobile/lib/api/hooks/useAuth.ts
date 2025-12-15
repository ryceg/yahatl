/**
 * Auth API Hooks
 *
 * TanStack Query hooks for authentication operations.
 * These provide an alternative to using the authStore directly.
 */
import { useMutation } from '@tanstack/react-query';
import {
  AuthClient,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  API_BASE_URL,
} from '../client';
import { queryClient } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import * as tokenStorage from '../../services/tokenStorage';

/**
 * Get a configured AuthClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getAuthClient() {
  return new AuthClient(API_BASE_URL);
}

/**
 * Hook for user login.
 *
 * On success, stores tokens in auth store and secure storage.
 */
export function useLogin() {
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (request: LoginRequest) => {
      const client = getAuthClient();
      return client.login(request);
    },
    onSuccess: async (data: AuthResponse) => {
      if (data.token) {
        // Store tokens in secure storage and auth store
        await tokenStorage.saveTokens(data.token, data.refreshToken ?? '');
        setTokens(data.token, data.refreshToken ?? null);
      }
    },
  });
}

/**
 * Hook for user registration.
 *
 * On success, stores tokens in auth store and secure storage.
 */
export function useRegister() {
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (request: RegisterRequest) => {
      const client = getAuthClient();
      return client.register(request);
    },
    onSuccess: async (data: AuthResponse) => {
      if (data.token) {
        await tokenStorage.saveTokens(data.token, data.refreshToken ?? '');
        setTokens(data.token, data.refreshToken ?? null);
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

