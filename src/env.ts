// Environment variable validation and type safety
// Usage: import { env } from '@/env'

// Direct access to environment variables with fallbacks (server runtime)
const NODE_ENV = (process.env.NODE_ENV || 'development') as
  | 'development'
  | 'production'
  | 'test';

export const env = {
  // Discord Configuration
  CLIENT_ID: process.env.CLIENT_ID || '',
  CLIENT_SECRET: process.env.CLIENT_SECRET || '',
  BOT_TOKEN: process.env.BOT_TOKEN || '',

  // Application URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:4321',
  SUPPORT_SERVER: process.env.SUPPORT_SERVER || '',

  // Database
  MONGO_CONNECTION: process.env.MONGO_CONNECTION || '',

  // Webhook Security
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',

  // Environment
  NODE_ENV: NODE_ENV,
  PORT: process.env.PORT || '4321',
  PROD: NODE_ENV === 'production',
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
      'Missing required environment variables:',
      missing.join(', ')
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
