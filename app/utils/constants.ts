// @/utils/constants.ts
// Application-wide constants

export const DISCORD_COLORS = {
  BLURPLE: '#5865F2',
  GREEN: '#57F287',
  YELLOW: '#FEE75C',
  FUCHSIA: '#EB459E',
  RED: '#ED4245',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
} as const;

export const APP_COLORS = {
  PRIMARY: '#D4516B', // Amina rose-red
  ACCENT: '#A35174', // Amina crimson
  CYBER_BLUE: '#4CC9F0',
  IMPERIAL_GOLD: '#FFD700',
} as const;

export const TIMEOUTS = {
  RATE_LIMIT: 1000, // 1 second between requests
  RETRY: 5000, // 5 seconds before retry
} as const;
