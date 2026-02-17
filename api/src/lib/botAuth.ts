/**
 * Bot Authentication Library
 *
 * Handles bot registration, authentication, and secret management
 * using Discord's CLIENT_SECRET with hybrid verification (Discord API + KV cache).
 */

import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import type { Logger } from './logger';

// Verification cache duration (1 hour)
const VERIFICATION_TTL_MS = 60 * 60 * 1000;

// PBKDF2 configuration following OWASP recommendations
const PBKDF2_ITERATIONS = 600000; // OWASP recommended minimum for PBKDF2-SHA256
const PBKDF2_KEYLEN = 32; // 256 bits
const PBKDF2_DIGEST = 'sha256';
const SALT_LENGTH = 16; // 128 bits

// ============================================================================
// Hashing Utilities
// ============================================================================

/**
 * Hash a secret for secure storage using PBKDF2 with random salt
 * Format: salt.hash (hex-encoded, separated by dot)
 * Never store raw secrets!
 */
export function hashSecret(secret: string): string {
  // Generate cryptographically secure random salt
  const salt = randomBytes(SALT_LENGTH);

  // Derive key using PBKDF2
  const hash = pbkdf2Sync(
    secret,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );

  // Return salt.hash format (both hex-encoded)
  return `${salt.toString('hex')}.${hash.toString('hex')}`;
}

/**
 * Compare a secret against a stored hash using timing-safe comparison
 * Expected format: salt.hash (hex-encoded, separated by dot)
 */
export function verifySecretHash(secret: string, storedValue: string): boolean {
  try {
    // Parse stored value to extract salt and hash
    const parts = storedValue.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const [saltHex, hashHex] = parts;
    if (!saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const storedHash = Buffer.from(hashHex, 'hex');

    // Validate salt and hash lengths
    if (salt.length !== SALT_LENGTH || storedHash.length !== PBKDF2_KEYLEN) {
      return false;
    }

    // Derive key from provided secret using stored salt
    const derivedHash = pbkdf2Sync(
      secret,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST
    );

    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(derivedHash, storedHash);
  } catch {
    // Return false on any error (invalid hex, etc.)
    return false;
  }
}

// ============================================================================
// Discord API Verification
// ============================================================================

/**
 * Verify bot credentials against Discord API
 * Uses client_credentials grant to validate the secret
 */
export async function verifyWithDiscord(
  clientId: string,
  clientSecret: string,
  logger?: Logger
): Promise<{ valid: boolean; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'identify',
      }),
      signal: controller.signal,
    });

    // Clear the timeout since fetch completed
    clearTimeout(timeoutId);

    if (response.ok) {
      return { valid: true };
    }

    const error = await response.json().catch(() => ({}));
    return {
      valid: false,
      error:
        (error as { error_description?: string }).error_description ||
        'Invalid credentials',
    };
  } catch (err) {
    // Clear the timeout in case of error
    clearTimeout(timeoutId);

    // Handle abort case specifically
    if (err instanceof Error && err.name === 'AbortError') {
      if (logger) {
        logger.warn('Discord API timeout during verification', { clientId });
      } else {
        console.warn(
          '[botAuth] Discord API timeout during verification for client:',
          clientId
        );
      }
      return { valid: false, error: 'Discord API timeout' };
    }

    // Handle other errors
    if (logger) {
      logger.error(
        'Discord verification failed',
        err instanceof Error ? err : undefined,
        {
          clientId,
        }
      );
    } else {
      console.error('[botAuth] Discord verification failed:', err);
    }
    return { valid: false, error: 'Discord API unavailable' };
  }
}

/**
 * Fetch bot application info from Discord
 */
export async function fetchBotInfo(
  clientId: string,
  clientSecret: string,
  logger?: Logger
): Promise<{
  success: boolean;
  data?: { name: string; icon: string | null };
  error?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    // First get a token
    const tokenResponse = await fetch(
      'https://discord.com/api/v10/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'identify applications.commands.update',
        }),
        signal: controller.signal,
      }
    );

    if (!tokenResponse.ok) {
      clearTimeout(timeoutId);
      return { success: false, error: 'Failed to authenticate with Discord' };
    }

    const { access_token } = (await tokenResponse.json()) as {
      access_token: string;
    };

    // Fetch application info
    const appResponse = await fetch('https://discord.com/api/v10/oauth2/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      signal: controller.signal,
    });

    // Clear the timeout since both fetches completed
    clearTimeout(timeoutId);

    if (!appResponse.ok) {
      return { success: false, error: 'Failed to fetch application info' };
    }

    const appData = (await appResponse.json()) as {
      application: { name: string; icon: string | null };
    };

    return {
      success: true,
      data: {
        name: appData.application.name,
        icon: appData.application.icon,
      },
    };
  } catch (err) {
    // Clear the timeout in case of error
    clearTimeout(timeoutId);

    // Handle abort case specifically
    if (err instanceof Error && err.name === 'AbortError') {
      if (logger) {
        logger.warn('Discord API timeout during bot info fetch', { clientId });
      } else {
        console.warn(
          '[botAuth] Discord API timeout during bot info fetch for client:',
          clientId
        );
      }
      return { success: false, error: 'Discord API timeout' };
    }

    // Handle other errors
    if (logger) {
      logger.error(
        'Failed to fetch bot info',
        err instanceof Error ? err : undefined,
        {
          clientId,
        }
      );
    } else {
      console.error('[botAuth] Failed to fetch bot info:', err);
    }
    return { success: false, error: 'Discord API unavailable' };
  }
}

// ============================================================================
// Bot Registration
// ============================================================================

/**
 * Register a new bot or update existing registration
 */
export async function registerBot(
  kv: KVNamespace,
  payload: BotRegisterPayload
): Promise<{ success: boolean; error?: string }> {
  const { clientId, clientSecret, ownerId, ...metadata } = payload;

  // Step 1: Verify credentials with Discord
  const verification = await verifyWithDiscord(clientId, clientSecret);
  if (!verification.valid) {
    return {
      success: false,
      error: verification.error || 'Invalid Discord credentials',
    };
  }

  // Step 2: Fetch bot info from Discord for avatar
  const botInfo = await fetchBotInfo(clientId, clientSecret);

  // Step 3: Store auth data (hashed secret)
  const now = new Date().toISOString();
  const verificationExpires = new Date(
    Date.now() + VERIFICATION_TTL_MS
  ).toISOString();

  const authData: BotAuthData = {
    secretHash: hashSecret(clientSecret),
    registeredAt: now,
    lastVerified: now,
    verificationExpires,
    ownerId,
  };

  await kv.put(`bot:${clientId}:auth`, JSON.stringify(authData));

  // Step 4: Store public metadata
  const metaData: BotMeta = {
    clientId,
    name: metadata.name || botInfo.data?.name || 'Unknown Bot',
    avatar: botInfo.data?.icon || null,
    ownerId,
    registeredAt: now,
    lastSeen: now,
    version: metadata.version,
    inviteUrl: metadata.inviteUrl,
    supportServer: metadata.supportServer,
    website: metadata.website,
    isPublic: metadata.isPublic ?? false,
    features: metadata.features,
  };

  await kv.put(`bot:${clientId}:meta`, JSON.stringify(metaData));

  console.log(`[botAuth] Bot registered: ${clientId} (${metaData.name})`);

  return { success: true };
}

// ============================================================================
// Bot Authentication (Hybrid: KV Cache + Discord Verification)
// ============================================================================

/**
 * Validate bot request credentials
 * Uses cached verification, falls back to Discord API when expired
 */
export async function validateBotRequest(
  kv: KVNamespace,
  clientId: string,
  clientSecret: string,
  logger?: Logger
): Promise<{ valid: boolean; error?: string; needsReVerification?: boolean }> {
  // Step 1: Get auth data from KV
  const authDataRaw = await kv.get(`bot:${clientId}:auth`);

  if (!authDataRaw) {
    return { valid: false, error: 'Bot not registered' };
  }

  let authData: BotAuthData;
  try {
    authData = JSON.parse(authDataRaw);
  } catch (err) {
    if (logger) {
      logger.error(`Corrupted auth data for bot ${clientId}`, err, {
        clientId,
      });
    } else {
      console.error(`[botAuth] Corrupted auth data for bot ${clientId}:`, err);
    }
    // Delete the corrupted entry
    await kv.delete(`bot:${clientId}:auth`);
    return { valid: false, error: 'Corrupted auth data' };
  }

  // Step 2: Quick hash comparison
  if (!verifySecretHash(clientSecret, authData.secretHash)) {
    // Secret doesn't match - could be rotated, try Discord verification
    const verification = await verifyWithDiscord(clientId, clientSecret);

    if (verification.valid) {
      // New secret is valid! Update stored hash
      authData.secretHash = hashSecret(clientSecret);
      authData.lastVerified = new Date().toISOString();
      authData.verificationExpires = new Date(
        Date.now() + VERIFICATION_TTL_MS
      ).toISOString();
      await kv.put(`bot:${clientId}:auth`, JSON.stringify(authData));

      console.log(`[botAuth] Secret rotated for bot: ${clientId}`);
      return { valid: true };
    }

    return { valid: false, error: 'Invalid secret' };
  }

  // Step 3: Check if verification cache expired
  const now = new Date();
  const expires = new Date(authData.verificationExpires);

  if (now > expires) {
    // Cache expired, re-verify with Discord
    const verification = await verifyWithDiscord(clientId, clientSecret);

    if (!verification.valid) {
      // Secret no longer valid with Discord
      return {
        valid: false,
        error: 'Credentials expired or revoked',
        needsReVerification: true,
      };
    }

    // Update verification timestamp
    authData.lastVerified = now.toISOString();
    authData.verificationExpires = new Date(
      Date.now() + VERIFICATION_TTL_MS
    ).toISOString();
    await kv.put(`bot:${clientId}:auth`, JSON.stringify(authData));

    console.log(`[botAuth] Re-verified bot: ${clientId}`);
  }

  return { valid: true };
}

// ============================================================================
// Bot Deregistration
// ============================================================================

/**
 * Remove a bot registration
 */
export async function deregisterBot(
  kv: KVNamespace,
  clientId: string,
  clientSecret: string,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> {
  // Validate credentials first
  const validation = await validateBotRequest(
    kv,
    clientId,
    clientSecret,
    logger
  );

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Delete all bot data from KV with robust error handling
  const keysToDelete = [
    `bot:${clientId}:auth`,
    `bot:${clientId}:meta`,
    `bot:${clientId}:stats`,
    `bot:${clientId}:commands`,
  ];

  // Use Promise.allSettled to ensure all deletions are attempted
  const deletionResults = await Promise.allSettled(
    keysToDelete.map((key) => kv.delete(key))
  );

  // Collect failed deletions for retry and monitoring
  const failedDeletions: { key: string; error: string }[] = [];
  deletionResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      const key = keysToDelete[index];
      if (!key) return; // Safety check
      const error =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      failedDeletions.push({ key, error });
      if (logger) {
        logger.error(`Failed to delete KV key: ${key}`, undefined, {
          key,
          error,
          clientId,
        });
      } else {
        console.error(`[botAuth] Failed to delete ${key}:`, error);
      }
    }
  });

  // Retry failed deletions once (idempotent operation)
  if (failedDeletions.length > 0) {
    if (logger) {
      logger.warn('Retrying failed KV deletions', {
        count: failedDeletions.length,
        clientId,
        keys: failedDeletions.map((f) => f.key),
      });
    } else {
      console.warn(
        `[botAuth] Retrying ${failedDeletions.length} failed deletions for bot ${clientId}`
      );
    }

    const retryResults = await Promise.allSettled(
      failedDeletions.map(({ key }) => kv.delete(key))
    );

    const stillFailed: string[] = [];
    retryResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const failedItem = failedDeletions[index];
        if (!failedItem) return; // Safety check
        const key = failedItem.key;
        const error =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        stillFailed.push(key);
        if (logger) {
          logger.error(`Retry failed for KV key: ${key}`, undefined, {
            key,
            error,
            clientId,
          });
        } else {
          console.error(`[botAuth] Retry failed for ${key}:`, error);
        }
      }
    });

    // If any deletions still failed after retry, return partial success with details
    if (stillFailed.length > 0) {
      if (logger) {
        logger.error('Bot deregistration incomplete', undefined, {
          clientId,
          failedKeys: stillFailed,
          failedCount: stillFailed.length,
        });
      } else {
        console.error(
          `[botAuth] Bot deregistration incomplete for ${clientId}. Failed keys:`,
          stillFailed
        );
      }
      return {
        success: false,
        error: `Partial deregistration: failed to delete ${stillFailed.length} key(s). Keys: ${stillFailed.join(', ')}. Please retry or contact support.`,
      };
    }
  }

  console.log(`[botAuth] Bot deregistered successfully: ${clientId}`);

  return { success: true };
}

// ============================================================================
// Ownership Verification
// ============================================================================

/**
 * Check if a user owns a bot
 */
export async function verifyBotOwnership(
  kv: KVNamespace,
  clientId: string,
  userId: string,
  logger?: Logger
): Promise<boolean> {
  const authDataRaw = await kv.get(`bot:${clientId}:auth`);

  if (!authDataRaw) {
    return false;
  }

  let authData: BotAuthData;
  try {
    authData = JSON.parse(authDataRaw);
  } catch (err) {
    if (logger) {
      logger.error(`Corrupted auth data for bot ${clientId}`, err, {
        clientId,
      });
    } else {
      console.error(`[botAuth] Corrupted auth data for bot ${clientId}:`, err);
    }
    // Delete the corrupted entry
    await kv.delete(`bot:${clientId}:auth`);
    return false;
  }
  return authData.ownerId === userId;
}
