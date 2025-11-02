// Environment variable validation and type safety
// Usage: import { env } from '@/env'

import { z } from 'astro/zod';

const envSchema = z.object({
  // Discord Configuration
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  CLIENT_SECRET: z.string().min(1, 'CLIENT_SECRET is required'),

  // Application URLs
  BASE_URL: z
    .string()
    .default('http://localhost:4321')
    .transform((val) => {
      const isProduction = import.meta.env.PROD === true;
      if (isProduction && (!val || val === 'http://localhost:4321')) {
        throw new Error('BASE_URL must be set to your production domain');
      }
      return val;
    }),
  SUPPORT_SERVER: z.string().url().optional(),

  // Database
  MONGO_CONNECTION: z.string().min(1, 'MONGO_CONNECTION is required'),

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().regex(/^\d+$/).default('4321'),
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
