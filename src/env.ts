// Environment variable validation and type safety
// Usage: import { env } from '@/env'

import { z } from 'astro/zod';

const envSchema = z.object({
  // Discord Configuration
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  CLIENT_SECRET: z.string().min(1, 'CLIENT_SECRET is required'),
  BOT_TOKEN: z.string().optional(),

  // Application URLs
  BASE_URL: z.string().min(1, 'BASE_URL is required'),
  DOCS_URL: z.string().url().optional(),
  SUPPORT_SERVER: z.string().url().optional(),

  // Database
  MONGO_CONNECTION: z.string().min(1, 'MONGO_CONNECTION is required'),

  // Session & Security
  SESSION_PASSWORD: z
    .string()
    .min(16, 'SESSION_PASSWORD must be at least 16 characters'),

  // Optional API Keys
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  OPENAI: z.string().optional(),
  STRANGE_API_KEY: z.string().optional(),

  // Developer Settings
  DEV_ID: z.string().optional(),
  TEST_GUILD_ID: z.string().optional(),

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().regex(/^\d+$/).default('4321'),

  // Webhooks & Logging
  LOGS_WEBHOOK: z.string().url().optional(),
  HONEYBADGER_API_KEY: z.string().optional(),
  HONEYBADGER_ENV: z.string().optional(),

  // Lavalink Music Nodes (Optional)
  LAVALINK_HOST_1: z.string().optional(),
  LAVALINK_PORT_1: z.string().optional(),
  LAVALINK_PASSWORD_1: z.string().optional(),
  LAVALINK_SECURE_1: z.string().optional(),
  LAVALINK_ID_1: z.string().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration');
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
