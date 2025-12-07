// Bot Statistics Types

export type BotStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export interface BotStats {
  guildCount: number;
  memberCount: number;
  ping: number;
  status: BotStatus;
  cached: boolean;
  cacheAge?: number; // in seconds
  lastUpdated?: Date; // when bot last updated stats
  channels?: number; // total channel count
  uptimeHours?: number; // bot uptime in hours
  presence?: {
    status: BotStatus;
    message: string;
    type: string;
    url: string;
  };
}
