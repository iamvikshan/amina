import type { Guild, UserInfo } from '@/config/dashboard/types';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Discord CDN URLs
export function iconUrl(guild: Guild): string | undefined {
  if (!guild.icon) return undefined;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp`;
}

export function avatarUrl(user: UserInfo): string {
  if (!user.avatar) {
    // Default avatar
    const defaultAvatarId =
      user.discriminator === '0'
        ? (BigInt(user.id) >> BigInt(22)) % BigInt(6)
        : Number(user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarId}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=512`;
}

export function bannerUrl(id: string, banner: string): string {
  return `https://cdn.discordapp.com/banners/${id}/${banner}?size=1024`;
}

// API functions (server-side, called from routes)
export async function fetchUserInfo(accessToken: string): Promise<UserInfo> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  return response.json();
}

export async function fetchGuilds(accessToken: string): Promise<Guild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guilds: ${response.status}`);
  }

  return response.json();
}

export async function fetchGuild(
  accessToken: string,
  id: string
): Promise<Guild> {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guild: ${response.status}`);
  }

  return response.json();
}

export enum ChannelTypes {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_ANNOUNCEMENT = 5,
  ANNOUNCEMENT_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
}

export interface GuildChannel {
  id: string;
  type: ChannelTypes;
  name: string;
  position: number;
  parent_id: string | null;
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
}
