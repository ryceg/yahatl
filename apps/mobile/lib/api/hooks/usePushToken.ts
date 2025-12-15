/**
 * Push Token API Hooks
 *
 * TanStack Query hooks for push token operations.
 */
import { useMutation } from '@tanstack/react-query';
import { PushTokenClient, API_BASE_URL, RegisterPushTokenRequest } from '../client';

/**
 * Get configured PushTokenClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getPushTokenClient() {
  return new PushTokenClient(API_BASE_URL);
}

/**
 * Hook to register a push token with the backend.
 */
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async (pushToken: string) => {
      const client = getPushTokenClient();
      const request: RegisterPushTokenRequest = { pushToken };
      return await client.registerPushToken(request);
    },
  });
}

/**
 * Hook to unregister the push token from the backend.
 */
export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: async () => {
      const client = getPushTokenClient();
      return await client.unregisterPushToken();
    },
  });
}

/**
 * Hook to update the user's timezone.
 */
export function useUpdateTimezone() {
  return useMutation({
    mutationFn: async (timezone: string) => {
      const client = getPushTokenClient();
      return await client.updateTimezone({ timezone });
    },
  });
}

