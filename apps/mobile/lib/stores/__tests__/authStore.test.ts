import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock expo-secure-store before importing authStore
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock the API client - must be a class constructor
vi.mock('@/lib/api/client', () => {
  return {
    AuthClient: class MockAuthClient {
      login = vi.fn().mockResolvedValue({ token: 'test-token', refreshToken: 'test-refresh' });
    },
    LoginRequest: class {},
    ApiException: {
      isApiException: () => false,
    },
  };
});

// Mock http module
vi.mock('@/lib/api/http', () => ({
  API_BASE_URL: 'http://localhost:5000',
  createUnauthenticatedHttp: vi.fn().mockReturnValue({}),
}));

// Mock token storage
vi.mock('@/lib/services/tokenStorage', () => ({
  getTokens: vi.fn().mockResolvedValue({ accessToken: null, refreshToken: null }),
  saveTokens: vi.fn().mockResolvedValue(undefined),
  clearTokens: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks are set up
import { useAuthStore, type User } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  describe('setTokens', () => {
    it('should update accessToken and refreshToken', () => {
      useAuthStore.getState().setTokens('access-token-123', 'refresh-token-456');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
    });
  });

  describe('accessToken (token)', () => {
    it('should be accessible via accessToken', () => {
      useAuthStore.setState({ accessToken: 'some-token' });

      expect(useAuthStore.getState().accessToken).toBe('some-token');
    });
  });

  describe('setUser', () => {
    it('should update user', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      useAuthStore.getState().setUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
    });

    it('should clear user when set to null', () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test' },
      });

      useAuthStore.getState().setUser(null);

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when accessToken exists', () => {
      useAuthStore.setState({ accessToken: 'some-token' });

      expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    });

    it('should return false when accessToken is null', () => {
      useAuthStore.setState({ accessToken: null });

      expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear all auth state', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        error: 'some error',
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should be an alias for logout', async () => {
      useAuthStore.setState({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });
});
