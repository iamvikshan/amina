// @/lib/data-utils.ts
import { GuildManager } from '@/lib/database/mongoose';
import type { IGuild } from '@types';
import { getAuthCookies } from '@/lib/cookie-utils';
import type { Context } from 'hono';
import type { DiscordUser, DiscordGuild } from '@types';

// Cache interface
interface Cache<T> {
  data: T;
  timestamp: number;
}

// In-memory cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const guildsCache = new Map<string, Cache<DiscordGuild[]>>();

export function clearGuildsCache(): void {
  guildsCache.clear();
}

export function getAvatarUrl(user: DiscordUser): string {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
}

export function getInitials(username?: string): string {
  return username ? username.charAt(0).toUpperCase() : '?';
}

export function getServerIcon(guild: DiscordGuild): string | null {
  if (guild.icon) {
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
  }
  return null;
}

async function handleDiscordResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    const rateLimitData = await response.json();
    const retryAfter = (rateLimitData.retry_after || 5) * 1000;

    // Wait for the retry-after period
    await new Promise((resolve) => setTimeout(resolve, retryAfter));

    // Throw a specific error that can be caught and retried
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    throw new Error(`Discord API error: ${response.statusText}`);
  }

  return response.json();
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<T> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(url, options);
      return await handleDiscordResponse<T>(response);
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(
        `[fetchWithRetry] Attempt ${attempts}/${maxRetries} failed for ${url}:`,
        lastError.message
      );

      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.warn(`[fetchWithRetry] Rate limited, retrying...`);
        continue; // Retry after waiting
      }

      if (attempts === maxRetries) {
        console.error(
          `[fetchWithRetry] Max retries exceeded for ${url}. Last error:`,
          lastError.message
        );
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempts) * 1000;
      console.log(
        `[fetchWithRetry] Waiting ${waitTime}ms before retry ${attempts + 1}...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(
    `Max retries exceeded for ${url}. Last error: ${lastError?.message || 'Unknown'}`
  );
}

export async function getDiscordUserData(c: Context): Promise<DiscordUser> {
  const { accessToken, userData } = getAuthCookies(c);

  if (userData) {
    return userData;
  }

  if (!accessToken) {
    throw new Error('No access token found');
  }

  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  return await fetchWithRetry<DiscordUser>(
    'https://discord.com/api/users/@me',
    options
  );
}

export async function getDiscordGuilds(c: Context): Promise<DiscordGuild[]> {
  const { accessToken } = getAuthCookies(c);

  if (!accessToken) {
    console.error('[getDiscordGuilds] No access token found');
    throw new Error('No access token found');
  }

  // Check cache first
  const cached = guildsCache.get(accessToken);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    const age = Math.round((Date.now() - cached.timestamp) / 1000);
    console.log(
      `[getDiscordGuilds] Using cached guilds (age: ${age}s, TTL: 300s)`
    );
    return cached.data;
  }

  console.log(
    '[getDiscordGuilds] Cache miss or expired, fetching from Discord API'
  );

  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const guildsData = await fetchWithRetry<DiscordGuild[]>(
    'https://discord.com/api/users/@me/guilds?with_counts=true',
    options
  );

  // Update cache
  guildsCache.set(accessToken, {
    data: guildsData,
    timestamp: Date.now(),
  });

  return guildsData;
}

export async function getConfiguredGuilds(c: Context): Promise<IGuild[]> {
  const userGuilds = await getDiscordGuilds(c);

  const adminGuilds = userGuilds.filter((guild: DiscordGuild) => {
    const permissions = BigInt(guild.permissions);
    return (permissions & 0x8n) === 0x8n;
  });

  const guildManager = await GuildManager.getInstance();

  const configuredGuildPromises = adminGuilds.map((guild: DiscordGuild) => {
    return guildManager.getGuild(guild.id);
  });

  const configuredGuildResults = await Promise.all(configuredGuildPromises);

  const configuredGuilds = configuredGuildResults.filter(
    (guild: IGuild | null): guild is IGuild => guild !== null
  );

  return configuredGuilds;
}
