/**
 * Cloudflare Workers environment bindings
 *
 * REQUIRED BINDINGS:
 * - MONGO_CONNECTION: MongoDB connection string
 * - RATE_LIMIT: KV namespace for rate limiting
 * - CACHE: KV namespace for caching
 * - BOTS: KV namespace for bot data
 *
 * OPTIONAL BINDINGS:
 * - DOPPLER_ENVIRONMENT: Environment identifier (dev/prd)
 * - LOGS_WEBHOOK: Discord webhook for error logging
 * - CLIENT_SECRET: Secret salt for HMAC hashing (BYOK - auto-generated if not provided)
 *
 * NOTE: Bot credentials (CLIENT_ID, CLIENT_SECRET) come from request headers
 * (X-Client-Id, X-Client-Secret), not environment variables.
 */

declare interface Env {
  // Doppler environment (dev/prd)
  DOPPLER_ENVIRONMENT?: string;

  // MongoDB - REQUIRED for database operations
  // Database name is extracted from URI path
  MONGO_CONNECTION: string;

  // Optional salt for HMAC hashing in rate limiting (BYOK)
  // Can be any secret value (e.g., your bot's CLIENT_SECRET)
  // If not provided, a per-instance random salt is auto-generated
  CLIENT_SECRET?: string;

  // Discord webhook for logging (Shoutrrr format: discord://TOKEN@WEBHOOK_ID)
  LOGS_WEBHOOK?: string;

  // KV Namespaces - REQUIRED for core functionality
  RATE_LIMIT: KVNamespace;
  CACHE: KVNamespace; // Alias for backward compatibility
  BOTS: KVNamespace; // Bot registration and stats

  // D1 Database (optional future use)
  // DB?: D1Database;
}
