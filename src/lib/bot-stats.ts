// @/lib/bot-stats.ts
// Bot statistics utilities for fetching real-time Discord bot data

import { env, validateRequiredEnv } from '@/env';

// Cache interface
interface BotStatsCache {
  guildCount: number;
  estimatedMembers: number;
  timestamp: number;
}

// In-memory cache (1 hour TTL)
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let statsCache: BotStatsCache | null = null;

// Average members per guild (conservative estimate)
// TODO: Replace with actual member counts from database (Option B)
// When implementing Option B:
// 1. Create a GuildStats collection in MongoDB with { guildId, memberCount, lastUpdated }
// 2. Use bot webhooks to update member counts on GUILD_CREATE, GUILD_UPDATE, GUILD_DELETE
// 3. Periodically sync member counts (daily background job)
// 4. Sum actual member counts instead of estimation
const AVG_MEMBERS_PER_GUILD = 100;

export interface BotStats {
  guildCount: number;
  estimatedMembers: number;
  cached: boolean;
  cacheAge?: number; // in seconds
}

/**
 * Fetch bot application info from Discord API
 */
async function fetchBotApplicationInfo(): Promise<{
  approximate_guild_count: number;
}> {
  validateRequiredEnv();

  const response = await fetch('https://discord.com/api/v10/applications/@me', {
    headers: {
      Authorization: `Bot ${env.BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[fetchBotApplicationInfo] Discord API error (${response.status}):`,
      errorText
    );
    throw new Error(
      `Failed to fetch bot stats: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Get bot statistics (guild count and estimated members)
 * Uses 1-hour cache to minimize API calls
 */
export async function getBotStats(): Promise<BotStats> {
  // Check cache first
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
    const cacheAge = Math.round((Date.now() - statsCache.timestamp) / 1000);
    console.log(
      `[getBotStats] Using cached stats (age: ${cacheAge}s, TTL: 3600s)`
    );
    return {
      guildCount: statsCache.guildCount,
      estimatedMembers: statsCache.estimatedMembers,
      cached: true,
      cacheAge,
    };
  }

  console.log('[getBotStats] Cache miss or expired, fetching from Discord API');

  try {
    const appInfo = await fetchBotApplicationInfo();
    const guildCount = appInfo.approximate_guild_count || 0;

    // TODO: Replace estimation with actual member counts from database (Option B)
    // Query: SELECT SUM(memberCount) FROM GuildStats WHERE leftAt IS NULL
    const estimatedMembers = guildCount * AVG_MEMBERS_PER_GUILD;

    // Update cache
    statsCache = {
      guildCount,
      estimatedMembers,
      timestamp: Date.now(),
    };

    console.log(
      `[getBotStats] Fetched fresh stats: ${guildCount} guilds, ~${estimatedMembers} members`
    );

    return {
      guildCount,
      estimatedMembers,
      cached: false,
    };
  } catch (error) {
    console.error('[getBotStats] Error fetching bot stats:', error);

    // If we have stale cache, return it as fallback
    if (statsCache) {
      console.warn('[getBotStats] Using stale cache as fallback');
      return {
        guildCount: statsCache.guildCount,
        estimatedMembers: statsCache.estimatedMembers,
        cached: true,
        cacheAge: Math.round((Date.now() - statsCache.timestamp) / 1000),
      };
    }

    // No cache available, throw error
    throw error;
  }
}

/**
 * Clear the bot stats cache (useful for testing or manual refresh)
 */
export function clearBotStatsCache(): void {
  statsCache = null;
  console.log('[clearBotStatsCache] Cache cleared');
}

/**
 * Format large numbers with commas and optional suffix
 */
export function formatStatNumber(num: number, suffix = ''): string {
  return num.toLocaleString('en-US') + suffix;
}
