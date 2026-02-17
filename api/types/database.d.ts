/**
 * Database-related type definitions
 */

/**
 * MongoDB connection configuration
 */
export interface MongoDBConfig {
  connectionString: string;
  database: string;
}

/**
 * Automod configuration
 */
export interface AutomodSettings {
  enabled: boolean;
  filters?: string[];
  actions?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Welcome/Farewell configuration
 */
export interface WelcomeSettings {
  enabled: boolean;
  channelId?: string;
  message?: string;
  embed?: boolean;
  [key: string]: unknown;
}

/**
 * Ticket system configuration
 */
export interface TicketSettings {
  enabled: boolean;
  categoryId?: string;
  transcriptChannelId?: string;
  [key: string]: unknown;
}

/**
 * Logging configuration
 */
export interface LogsSettings {
  enabled: boolean;
  channelId?: string;
  events?: string[];
  [key: string]: unknown;
}

/**
 * Guild settings stored in MongoDB
 */
export interface GuildSettings {
  guildId: string;
  prefix?: string;
  automod?: AutomodSettings;
  welcome?: WelcomeSettings;
  ticket?: TicketSettings;
  logs?: LogsSettings;
}

/**
 * API key document
 */
export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  prefix: string;
  permissions: string[];
  rateLimit: RateLimitConfig;
  usage: {
    total: number;
    lastUsed: Date | null;
  };
  createdAt: Date;
  expiresAt: Date | null;
  revoked: boolean;
}

/**
 * User with their API keys
 */
export interface UserWithApiKeys {
  _id: string;
  username?: string;
  apiKeys?: ApiKey[];
}
