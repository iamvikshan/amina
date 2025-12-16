// Dashboard types
export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
}

export interface UserInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number;
  locale?: string;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface GuildInfo extends Guild {
  enabledFeatures: string[];
}

export type IconHash = string;
