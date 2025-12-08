// Environment variable validation and type safety
// Usage: import { env } from '@/config/env'

// Direct access to environment variables with fallbacks (server runtime)
const NODE_ENV = (process.env.NODE_ENV || 'development') as
  | 'development'
  | 'production'
  | 'test';

/**
 * Runtime Secrets Configuration
 * ==============================
 * ONLY secrets belong here. Public URLs live in app/config/site.ts
 *
 * Required secrets:
 * - CLIENT_ID: Discord application client ID
 * - CLIENT_SECRET: Discord application client secret
 * - BOT_TOKEN: Discord bot token
 * - MONGO_CONNECTION: MongoDB connection string
 * - WEBHOOK_SECRET: Secret for webhook verification
 */
export const env = {
  // Discord Configuration
  CLIENT_ID: process.env.CLIENT_ID || '',
  CLIENT_SECRET: process.env.CLIENT_SECRET || '',
  BOT_TOKEN: process.env.BOT_TOKEN || '',

  // Database
  MONGO_CONNECTION: process.env.MONGO_CONNECTION || '',

  // Webhook Security
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',

  // Instatus API
  INSTATUS_API: process.env.INSTATUS_API || '',

  // Environment
  NODE_ENV: NODE_ENV,
  PROD: NODE_ENV === 'production',
} as const;

// Helper to validate required env vars at runtime
export function validateRequiredEnv(): void {
  const required = [
    'CLIENT_ID',
    'CLIENT_SECRET',
    'BOT_TOKEN',
    'MONGO_CONNECTION',
  ] as const;
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.error(
      'Missing required environment variables:',
      missing.join(', ')
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
