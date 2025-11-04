// Environment variable validation and type safety
// Usage: import { env } from '@/env'

// Direct access to environment variables with fallbacks
export const env = {
  // Discord Configuration
  CLIENT_ID: import.meta.env.CLIENT_ID || '',
  CLIENT_SECRET: import.meta.env.CLIENT_SECRET || '',
  BOT_TOKEN: import.meta.env.BOT_TOKEN || '',

  // Application URLs
  BASE_URL: import.meta.env.BASE_URL || 'http://localhost:4321',
  SUPPORT_SERVER: import.meta.env.SUPPORT_SERVER || '',

  // Database
  MONGO_CONNECTION: import.meta.env.MONGO_CONNECTION || '',

  // Webhook Security
  WEBHOOK_SECRET: import.meta.env.WEBHOOK_SECRET || '',

  // Environment
  NODE_ENV:
    (import.meta.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  PORT: import.meta.env.PORT || '4321',
  PROD: import.meta.env.PROD || false,
} as const;

// Type for the environment variables
export type Env = typeof env;

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
      '❌ Missing required environment variables:',
      missing.join(', ')
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
