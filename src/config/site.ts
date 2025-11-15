/**
 * Site Configuration
 * ==================
 * Central source of truth for all site URLs, metadata, and public links.
 *
 * Structure:
 * - SITE: Core site metadata (title, description, URL)
 * - URLS: All external/public URLs (docs, Discord, GitHub, etc.)
 * - SEO: Structured data for search engines
 * - OG: Open Graph metadata for social sharing
 *
 * Secrets (CLIENT_ID, CLIENT_SECRET, etc.) remain in src/env.ts
 */

// Environment-based URL configuration
// Defaults to production URL for safety - only uses localhost when explicitly in dev mode
const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
const BASE_URL = isDev ? 'http://localhost:4321' : 'https://4mina.app';

// ============================================================================
// Core Site Metadata
// ============================================================================
export const SITE = {
  title: 'Amina',
  tagline: 'Your Creative & Energetic Discord Companion!',
  description:
    'Meet Amina, a vibrant Discord bot bringing creativity, fun, and a dash of chaos to your server! Currently in development, Amina offers unique features wrapped in a playful personality. Join us in shaping her future!',
  description_short:
    'A quirky, artistic Discord bot that brings life to your server with creative features and infectious enthusiasm.',
  url: BASE_URL,
  author: 'Vikshan',
} as const;

// ============================================================================
// Public URLs (safe to commit)
// ============================================================================
export const URLS = {
  // Documentation & Resources
  docs: 'https://docs.4mina.app',

  // Discord Links
  support: 'https://discord.gg/uMgS9evnmv', // Support server
  // Bot invite URL is generated dynamically in permalinks.ts using CLIENT_ID

  // Development & Source
  github: 'https://github.com/iamvikshan/amina',

  // Social Media
  social: {
    // Discord invite is generated dynamically in permalinks.ts
    x: 'https://twitter.com/iamvikshan',
    github: 'https://github.com/iamvikshan/amina',
    youtube: 'https://youtube.com/@vikshan',
  },
} as const;

// ============================================================================
// SEO Configuration
// ============================================================================
export const SEO = {
  title: SITE.title,
  description: SITE.description,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    inLanguage: 'en-US',
    '@id': SITE.url,
    url: SITE.url,
    name: SITE.title,
    description: SITE.description,
    isPartOf: {
      '@type': 'WebSite',
      url: SITE.url,
      name: SITE.title,
      description: SITE.description,
    },
  },
} as const;

// ============================================================================
// Open Graph Metadata
// ============================================================================
export const OG = {
  locale: 'en_US',
  type: 'website',
  url: SITE.url,
  title: `${SITE.title}: Your Creative Discord Companion`,
  description:
    "Introducing Amina, a uniquely personable Discord bot with a flair for creativity and fun! Currently in development, she's looking for fellow creators and developers to help shape her features and personality. Join our community and be part of something special!",
  image: '/social.png',
} as const;
