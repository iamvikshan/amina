// Global Type Definitions
// These types are available globally throughout the application

import type { ImageMetadata } from 'astro';

// Environment Types
declare global {
  interface ImportMetaEnv {
    readonly CLIENT_ID: string;
    readonly CLIENT_SECRET: string;
    readonly MONGO_CONNECTION: string;
    readonly INSTATUS_API: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Manifest Types
export interface Favicon {
  purpose: 'any' | 'maskable' | 'monochrome';
  src: ImageMetadata;
  sizes: number[];
}

// Environment Configuration Type
export type Env = {
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  readonly BOT_TOKEN: string;
  readonly MONGO_CONNECTION: string;
  readonly WEBHOOK_SECRET: string;
  readonly INSTATUS_API: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly PROD: boolean;
};

export {};
