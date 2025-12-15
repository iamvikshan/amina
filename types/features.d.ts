/**
 * Feature Configuration Types
 * Based on reference: src/config/types/
 */

/** Feature identifier */
export type FeatureId =
  | 'welcome'
  | 'farewell'
  | 'logging'
  | 'automod'
  | 'ticket'
  | 'warnings'
  | 'stats';

/** Feature configuration */
export interface FeatureConfig {
  id: FeatureId;
  name: string;
  description: string;
  icon: string;
}

// Legacy types for backwards compatibility with index.d.ts exports
export type FeatureDefinition = FeatureConfig;
export type FeatureCategory = 'moderation' | 'engagement' | 'utility';
export type FeatureStatus = 'enabled' | 'disabled' | 'partial';
export interface GuildFeatureInfo {
  id: FeatureId;
  enabled: boolean;
}
export type FieldType =
  | 'text'
  | 'number'
  | 'toggle'
  | 'select'
  | 'channel'
  | 'role';
export interface FeatureField {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
}
export interface FeatureFormConfig {
  fields: FeatureField[];
}

/** Custom features data structure (from bot) */
export interface CustomFeatures {
  welcome?: WelcomeFeature;
  farewell?: FarewellFeature;
  logging?: LoggingFeature;
  automod?: AutomodFeature;
  ticket?: TicketFeature;
  warnings?: WarningsFeature;
  stats?: StatsFeature;
}

export interface WelcomeFeature {
  channel?: string;
  message?: string;
  embed?: boolean;
}

export interface FarewellFeature {
  channel?: string;
  message?: string;
}

export interface LoggingFeature {
  channel?: string;
  events?: string[];
}

export interface AutomodFeature {
  enabled?: boolean;
  filters?: string[];
  action?: 'warn' | 'mute' | 'kick' | 'ban';
}

export interface TicketFeature {
  category?: string;
  supportRole?: string;
  welcomeMessage?: string;
}

export interface WarningsFeature {
  maxWarnings?: number;
  action?: 'mute' | 'kick' | 'ban';
  duration?: number;
}

export interface StatsFeature {
  enabled?: boolean;
  trackMessages?: boolean;
  trackVoice?: boolean;
}

/** Guild info with enabled features */
export interface CustomGuildInfo {
  enabledFeatures: FeatureId[];
}
