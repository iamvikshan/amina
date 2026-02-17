/**
 * Bot Registration and Management Types
 *
 * Type definitions for multi-bot support in the Amina API ecosystem.
 */

/**
 * Bot authentication data stored in KV
 * Key pattern: `bot:{clientId}:auth`
 */
declare interface BotAuthData {
  secretHash: string;
  registeredAt: string;
  lastVerified: string;
  verificationExpires: string;
  ownerId: string;
}

/**
 * Bot metadata stored in KV (public-safe)
 * Key pattern: `bot:{clientId}:meta`
 */
declare interface BotMeta {
  clientId: string;
  name: string;
  avatar: string | null;
  ownerId: string;
  registeredAt: string;
  lastSeen: string;
  version: string;
  inviteUrl?: string;
  supportServer?: string;
  website?: string;
  isPublic: boolean;
  features?: string[];
}

/**
 * Bot statistics stored in KV
 * Key pattern: `bot:{clientId}:stats`
 * TTL: 5 minutes
 */
declare interface BotStatsData {
  guilds: number;
  members: number;
  channels: number;
  commands: number;
  ping: number;
  uptime: number;
  memoryUsage?: number;
  shards?: ShardInfo[];
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
  presence?: {
    type: string;
    name: string;
    url?: string;
  };
  lastUpdated: string | null;
  hasStats?: boolean;
}

/**
 * Shard information
 */
declare interface ShardInfo {
  id: number;
  status: 'ready' | 'connecting' | 'disconnected';
  guilds: number;
  ping: number;
}

/**
 * Bot commands data stored in KV
 * Key pattern: `bot:{clientId}:commands`
 */
declare interface BotCommandsData {
  commands: BotCommand[];
  categories: string[];
  totalCommands: number;
  lastUpdated: string;
}

/**
 * Individual bot command
 */
declare interface BotCommand {
  name: string;
  description: string;
  category: string;
  usage?: string;
  examples?: string[];
  aliases?: string[];
  cooldown?: number;
  permissions?: string[];
  botPermissions?: string[];
  nsfw?: boolean;
  ownerOnly?: boolean;
}

/**
 * Bot registration request payload
 */
declare interface BotRegisterPayload {
  clientId: string;
  clientSecret: string;
  name: string;
  ownerId: string;
  version: string;
  inviteUrl?: string;
  supportServer?: string;
  website?: string;
  isPublic?: boolean;
  features?: string[];
}

/**
 * Bot stats push payload
 */
declare interface BotStatsPushPayload {
  guilds: number;
  members: number;
  channels: number;
  commands: number;
  ping: number;
  uptime: number;
  memoryUsage?: number;
  shards?: ShardInfo[];
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
  presence?: {
    type: string;
    name: string;
    url?: string;
  };
}

/**
 * Bot authentication context for middleware
 */
declare interface BotAuthContext {
  botClientId: string;
  botClientSecret: string;
}

/**
 * Bot statistics response (for getBotStats function)
 */
declare interface BotStats {
  guilds: number;
  members: number;
  channels: number;
  ping: number;
  uptime: number;
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
  presence?: {
    status: string;
    message: string;
    type: string;
    url: string;
  };
  lastUpdated: string;
}

/**
 * Options for fetching bot statistics
 */
declare interface BotStatsOptions {
  url?: string;
}
