/**
 * Push Token API Hooks
 *
 * TanStack Query hooks for push notification token registration.
 * Note: Push token endpoints not yet implemented in HA integration.
 */
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for registering a push token.
 * Stub - push notifications handled by HA Companion app.
 */
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async (_token: string) => {
      // Stub - push tokens managed by HA Companion app
      return { registered: true };
    },
  });
}

/**
 * Hook for unregistering a push token.
 */
export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: async (_token: string) => {
      return { unregistered: true };
    },
  });
}
