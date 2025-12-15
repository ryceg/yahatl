/**
 * Token Storage Service
 *
 * Secure token storage using expo-secure-store.
 * Provides abstraction layer for persisting auth tokens.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'yahatl_access_token';
const REFRESH_TOKEN_KEY = 'yahatl_refresh_token';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Save tokens to secure storage
 */
export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

/**
 * Get tokens from secure storage
 */
export async function getTokens(): Promise<StoredTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Get just the access token (for API calls)
 */
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/**
 * Clear all tokens (for logout)
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
