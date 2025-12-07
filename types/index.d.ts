// Central Type Declarations
// All types are exported from this single barrel file

// Database Types
export type { IUser, IUserFlag, IUserProfile } from './user.d.ts';

export type {
  IGuild,
  IGuildServer,
  IGuildStats,
  IGuildTicket,
  IGuildAutomod,
  IGuildInvite,
  IGuildLogs,
  IGuildMaxWarn,
  IGuildCounter,
  IGuildEmbed,
  IGuildWelcomeFarewell,
  IGuildSuggestions,
} from './guild.d.ts';

// Library Types
export type { InstatusComponent, Monitor, UptimeStats } from './uptime.d.ts';

export type { TokenData } from './discord-auth.d.ts';

export type { DiscordUser, DiscordGuild } from './discord.d.ts';

export type { BotStats } from './bot-stats.d.ts';

export type { Achievement, AchievementCategory } from './achievements.d.ts';

export type { GuardianRank } from './guardian-ranks.d.ts';

// Middleware Types
export type { RouteConfig } from './auth.d.ts';

export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from './errors';

// Global Types
export type { Env, Favicon } from './global.d.ts';
