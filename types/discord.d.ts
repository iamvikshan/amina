// Discord API Types

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string;
  avatar: string;
  bot?: boolean;
  verified?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  approximate_member_count?: number;
}
