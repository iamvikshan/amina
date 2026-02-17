/**
 * API Key Management
 *
 * API keys are:
 * - Generated with crypto.randomUUID() + random bytes
 * - Prefixed with `amina_` for easy identification
 * - Stored as SHA-256 hashes (never store raw keys)
 * - Have a visible prefix for user reference
 */

import type { MongoDB } from './mongodb';
import { ApiKey, UserWithApiKeys } from '../../types/database';

/**
 * Generate a secure random API key
 * Format: amina_<32 random chars>
 */
export async function generateApiKey(): Promise<{
  key: string;
  prefix: string;
  hash: string;
}> {
  // Generate 24 random bytes (will be 32 chars in base64url)
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);

  // Convert to base64url (URL-safe base64 without padding)
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const key = `amina_${base64}`;
  const prefix = key.slice(0, 12); // "amina_xxxxxx"
  const hash = await hashApiKey(key);

  return { key, prefix, hash };
}

/**
 * Hash an API key using SHA-256
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Find a user by API key hash
 */
export async function findUserByApiKey(
  db: MongoDB,
  apiKey: string
): Promise<{ user: UserWithApiKeys; apiKey: ApiKey } | null> {
  const hash = await hashApiKey(apiKey);

  const user = await db.findOne<UserWithApiKeys>('users', {
    'apiKeys.keyHash': hash,
    'apiKeys.revoked': false,
  });

  if (!user || !user.apiKeys) {
    return null;
  }

  const key = user.apiKeys.find((k) => k.keyHash === hash && !k.revoked);
  if (!key) {
    return null;
  }

  return { user, apiKey: key };
}

/**
 * Update API key usage
 */
export async function updateApiKeyUsage(
  db: MongoDB,
  userId: string,
  keyId: string
): Promise<void> {
  await db.updateOne(
    'users',
    { _id: userId, 'apiKeys.id': keyId },
    {
      $inc: { 'apiKeys.$.usage.total': 1 },
      $set: { 'apiKeys.$.usage.lastUsed': new Date() },
    }
  );
}
