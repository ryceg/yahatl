/**
 * Auth Store
 *
 * Central authentication state management using Zustand.
 * Handles login, logout, token management, and auth state.
 */
import { create } from 'zustand';
import * as tokenStorage from '@/lib/services/tokenStorage';
import {
  AuthClient,
  LoginRequest,
  ApiException,
  API_BASE_URL,
} from '@/lib/api/client';

/**
 * User information stored after authentication.
 */
export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  // Token state (accessToken aliased as token for API compatibility)
  accessToken: string | null;
  refreshToken: string | null;

  // User info
  user: User | null;

  // UI state
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  /**
   * Initialize auth state from secure storage.
   * Should be called on app start.
   */
  initialize: () => Promise<void>;

  /**
   * Login with email and password.
   * @returns true if login was successful
   */
  login: (email: string, password: string) => Promise<boolean>;

  /**
   * Logout and clear all tokens.
   */
  logout: () => Promise<void>;

  /**
   * Check if user is authenticated.
   */
  isAuthenticated: () => boolean;

  /**
   * Clear any error state.
   */
  clearError: () => void;

  /**
   * Set tokens (used internally and by 401 handler).
   */
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;

  /**
   * Set user information after login.
   */
  setUser: (user: User | null) => void;

  /**
   * Clear all auth state (alias for logout).
   */
  clearAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Create auth client for login/register
// Note: AuthClient extends AuthorizedApiBase, but login/register don't require auth
const authClient = new AuthClient(API_BASE_URL);

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const tokens = await tokenStorage.getTokens();
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const request: LoginRequest = { email, password };
      const response = await authClient.login(request);

      if (!response.token) {
        throw new Error('No token received from server');
      }

      // Save tokens to secure storage
      await tokenStorage.saveTokens(
        response.token,
        response.refreshToken ?? ''
      );

      set({
        accessToken: response.token,
        refreshToken: response.refreshToken ?? null,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      let message = 'Login failed';

      if (ApiException.isApiException(error)) {
        // Handle specific API errors
        if (error.status === 401) {
          message = 'Invalid email or password';
        } else {
          message = error.response || error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    try {
      await tokenStorage.clearTokens();
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }

    set({
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  },

  isAuthenticated: () => {
    return get().accessToken !== null;
  },

  clearError: () => {
    set({ error: null });
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    set({ user });
  },

  clearAuth: async () => {
    // Alias for logout
    await get().logout();
  },
}));
