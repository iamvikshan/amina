// @/lib/bot-stats.ts
// Bot statistics utilities for fetching real-time bot data from shared database
// Updated every 10 minutes by bot's presence handler

import { connectDB } from '@/lib/database/mongoose';
import mongoose from 'mongoose';

// Database types
interface BotStatsData {
  guilds: number;
  users: number;
  channels: number;
  ping: number;
  uptime: number;
  lastUpdated: Date;
}

interface PresenceData {
  ENABLED: boolean;
  STATUS: 'online' | 'idle' | 'dnd' | 'invisible';
  TYPE: string;
  MESSAGE: string;
  URL: string;
}

interface DevConfig {
  BOT_STATS?: BotStatsData;
  PRESENCE?: PresenceData;
  DEV_COMMANDS?: any;
  _id?: any;
  __v?: number;
}

// Cache interface
interface BotStatsCache {
  guildCount: number;
  memberCount: number;
  ping: number;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  timestamp: number;
}

// In-memory cache (10 minute TTL to match bot update frequency)
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let statsCache: BotStatsCache | null = null;

export interface BotStats {
  guildCount: number;
  memberCount: number;
  ping: number;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  cached: boolean;
  cacheAge?: number; // in seconds
  lastUpdated?: Date; // when bot last updated stats
}

/**
 * Fetch bot statistics from shared database (dev-configs collection)
 * Bot updates these stats every 10 minutes via presence handler
 */
async function fetchBotStatsFromDB(): Promise<{
  guilds: number;
  users: number;
  ping: number;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  lastUpdated: Date;
} | null> {
  await connectDB();

  // Query dev-configs collection for BOT_STATS
  const DevConfig =
    mongoose.models['dev-config'] ||
    mongoose.model(
      'dev-config',
      new mongoose.Schema({}, { strict: false, collection: 'dev-configs' })
    );

  const config = (await DevConfig.findOne().lean()) as DevConfig | null;

  if (!config?.BOT_STATS) {
    return null;
  }

  return {
    guilds: config.BOT_STATS.guilds || 0,
    users: config.BOT_STATS.users || 0,
    ping: config.BOT_STATS.ping || 0,
    status: config.PRESENCE?.STATUS || 'online',
    lastUpdated: config.BOT_STATS.lastUpdated || new Date(),
  };
}

/**
 * Get bot statistics (guild count and member count)
 * Uses 10-minute cache to match bot update frequency
 * Data is updated by bot every 10 minutes via presence handler
 */
export async function getBotStats(): Promise<BotStats> {
  // Check cache first
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
    const cacheAge = Math.round((Date.now() - statsCache.timestamp) / 1000);
    return {
      guildCount: statsCache.guildCount,
      memberCount: statsCache.memberCount,
      ping: statsCache.ping,
      status: statsCache.status,
      cached: true,
      cacheAge,
    };
  }

  try {
    const dbStats = await fetchBotStatsFromDB();

    if (!dbStats) {
      // Return defaults if no stats available
      return {
        guildCount: 0,
        memberCount: 0,
        ping: 0,
        status: 'online',
        cached: false,
      };
    }

    // Update cache
    statsCache = {
      guildCount: dbStats.guilds,
      memberCount: dbStats.users,
      ping: dbStats.ping,
      status: dbStats.status,
      timestamp: Date.now(),
    };

    return {
      guildCount: dbStats.guilds,
      memberCount: dbStats.users,
      ping: dbStats.ping,
      status: dbStats.status,
      cached: false,
      lastUpdated: dbStats.lastUpdated,
    };
  } catch (error) {
    console.error('[getBotStats] Error fetching bot stats:', error);

    // If we have stale cache, return it as fallback
    if (statsCache) {
      return {
        guildCount: statsCache.guildCount,
        memberCount: statsCache.memberCount,
        ping: statsCache.ping,
        status: statsCache.status,
        cached: true,
        cacheAge: Math.round((Date.now() - statsCache.timestamp) / 1000),
      };
    }

    // No cache available, return defaults
    return {
      guildCount: 0,
      memberCount: 0,
      ping: 0,
      status: 'online',
      cached: false,
    };
  }
}

/**
 * Format large numbers with commas and optional suffix
 */
export function formatStatNumber(num: number, suffix = ''): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M' + suffix;
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K' + suffix;
  }
  return num.toLocaleString('en-US') + suffix;
}
