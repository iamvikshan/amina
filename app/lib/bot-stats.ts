// @/lib/bot-stats.ts
// Bot statistics utilities for fetching real-time bot data from shared database
// Updated every 10 minutes by bot's presence handler

import mongoose from 'mongoose';
import { connectDB } from '@/lib/database/mongoose';
import type { BotStats } from '@types';

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
  DEV_COMMANDS?: unknown;
  _id?: unknown;
  __v?: number;
}

// Cache interface
interface BotStatsCache {
  guildCount: number;
  memberCount: number;
  ping: number;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  timestamp: number;
  channels?: number;
  uptimeHours?: number;
  presence?: {
    status: 'online' | 'idle' | 'dnd' | 'invisible';
    message: string;
    type: string;
    url: string;
  };
}

// In-memory cache (10 minute TTL to match bot update frequency)
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let statsCache: BotStatsCache | null = null;

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
  channels: number;
  uptime: number;
  presence?: {
    status: 'online' | 'idle' | 'dnd' | 'invisible';
    message: string;
    type: string;
    url: string;
  };
} | null> {
  await connectDB();

  // Query dev-configs collection for BOT_STATS
  const DevConfigModel =
    mongoose.models['dev-config'] ||
    mongoose.model(
      'dev-config',
      new mongoose.Schema({}, { strict: false, collection: 'dev-configs' })
    );

  const config = (await DevConfigModel.findOne().lean()) as DevConfig | null;

  if (!config?.BOT_STATS) {
    return null;
  }

  return {
    guilds: config.BOT_STATS.guilds || 0,
    users: config.BOT_STATS.users || 0,
    ping: config.BOT_STATS.ping || 0,
    status: config.PRESENCE?.STATUS || 'online',
    lastUpdated: config.BOT_STATS.lastUpdated || new Date(),
    channels: config.BOT_STATS.channels || 0,
    uptime: config.BOT_STATS.uptime || 0,
    presence: config.PRESENCE
      ? {
          status: config.PRESENCE.STATUS || 'online',
          message: config.PRESENCE.MESSAGE || 'On patrol',
          type: config.PRESENCE.TYPE || 'CUSTOM',
          url: config.PRESENCE.URL || '',
        }
      : undefined,
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
      channels: statsCache.channels,
      uptimeHours: statsCache.uptimeHours,
      presence: statsCache.presence,
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
    const uptimeHours = dbStats.uptime / 3600; // Convert seconds to hours

    statsCache = {
      guildCount: dbStats.guilds,
      memberCount: dbStats.users,
      ping: dbStats.ping,
      status: dbStats.status,
      timestamp: Date.now(),
      channels: dbStats.channels,
      uptimeHours,
      presence: dbStats.presence,
    };

    return {
      guildCount: dbStats.guilds,
      memberCount: dbStats.users,
      ping: dbStats.ping,
      status: dbStats.status,
      cached: false,
      lastUpdated: dbStats.lastUpdated,
      channels: dbStats.channels,
      uptimeHours,
      presence: dbStats.presence,
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
        channels: statsCache.channels,
        uptimeHours: statsCache.uptimeHours,
        presence: statsCache.presence,
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
