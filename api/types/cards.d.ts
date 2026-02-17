/**
 * Card generation type definitions
 */

/**
 * Rank card generation options
 */
export interface RankCardOptions {
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  requiredXp: number;
  rank: number;
  discriminator?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  background?: string;
  progressColor?: string;
  textColor?: string;
  theme?: 'dark' | 'light' | 'amina';
}

/**
 * Spotify card generation options
 */
export interface SpotifyCardOptions {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  /**
   * Track playback progress as a percentage (0–100, inclusive).
   * - 0 = beginning of the track
   * - 100 = end of the track
   * - Defaults to 50 if undefined or NaN
   * - Values outside [0, 100] are not clamped but may produce unexpected visual results
   */
  progress?: number;
  duration?: string;
  currentTime?: string;
  isPlaying?: boolean;
}

/**
 * Welcome card generation options
 */
export interface WelcomeCardOptions {
  username: string;
  avatar?: string;
  discriminator?: string;
  memberCount: number;
  guildName: string;
  type?: 'welcome' | 'farewell';
  message?: string;
  background?: string;
  accentColor?: string;
  textColor?: string;
}
