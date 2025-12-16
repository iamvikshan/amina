/** @jsxImportSource react */
import { createIcon } from '@chakra-ui/react';
import type { ReactElement } from 'react';
import type { Guild } from './types';

// Amina Bot Icon
const AminaIcon = createIcon({
  displayName: 'AminaLogo',
  viewBox: '0 0 512 512',
  path: (
    <g>
      <path
        d="m494.6,241.1l-50.1-47c-50.5-47.3-117.4-73.3-188.5-73.3-71.1,0-138,26-188.4,73.3l-50.1,47c-12.1,12.9-4.3,26.5 0,29.8l50.1,47c50.4,47.3 117.3,73.3 188.4,73.3 71.1,0 138-26 188.4-73.3l50.1-47c4.7-3.9 12.2-17.6 0.1-29.8zm-238.6,74.9c-33.1,0-60-26.9-60-60 0-33.1 26.9-60 60-60 33.1,0 60,26.9 60,60 0,33.1-26.9,60-60,60zm-194.7-60l34.3-32.1c32-30 72-49.9 115.5-58.1-33.1,16.6-55.8,50.8-55.8,90.2 0,39.4 22.8,73.7 55.8,90.2-43.5-8.1-83.5-28.1-115.5-58.1l-34.3-32.1zm355.2,32.1c-32,30-72,50-115.5,58.1 33.1-16.6 55.8-50.8 55.8-90.2 0-39.4-22.8-73.6-55.8-90.2 43.5,8.1 83.5,28.1 115.5,58.1l34.3,32.1-34.3,32.1z"
        fill="currentColor"
      />
      <path
        d="m256,235.2c-11.3,0-20.8,9.5-20.8,20.8 0,11.3 9.5,20.8 20.8,20.8 11.3,0 20.8-9.5 20.8-20.8 0-11.3-9.5-20.8-20.8-20.8z"
        fill="currentColor"
      />
    </g>
  ),
});

export enum PermissionFlags {
  CREATE_INSTANT_INVITE = 1 << 0,
  KICK_MEMBERS = 1 << 1,
  BAN_MEMBERS = 1 << 2,
  ADMINISTRATOR = 1 << 3,
  MANAGE_CHANNELS = 1 << 4,
  MANAGE_GUILD = 1 << 5,
  ADD_REACTIONS = 1 << 6,
  VIEW_AUDIT_LOG = 1 << 7,
  PRIORITY_SPEAKER = 1 << 8,
  STREAM = 1 << 9,
  VIEW_CHANNEL = 1 << 10,
  SEND_MESSAGES = 1 << 11,
  SEND_TTS_MESSAGES = 1 << 12,
  MANAGE_MESSAGES = 1 << 13,
  EMBED_LINKS = 1 << 14,
  ATTACH_FILES = 1 << 15,
  READ_MESSAGE_HISTORY = 1 << 16,
  MENTION_EVERYONE = 1 << 17,
  USE_EXTERNAL_EMOJIS = 1 << 18,
  VIEW_GUILD_INSIGHTS = 1 << 19,
  CONNECT = 1 << 20,
  SPEAK = 1 << 21,
  MUTE_MEMBERS = 1 << 22,
  DEAFEN_MEMBERS = 1 << 23,
  MOVE_MEMBERS = 1 << 24,
  USE_VAD = 1 << 25,
  CHANGE_NICKNAME = 1 << 26,
  MANAGE_NICKNAMES = 1 << 27,
  MANAGE_ROLES = 1 << 28,
  MANAGE_WEBHOOKS = 1 << 29,
  MANAGE_EMOJIS_AND_STICKERS = 1 << 30,
}

export interface AppConfig {
  name: string;
  icon: typeof AminaIcon;
  inviteUrl: string;
  guild: {
    filter: (guild: Guild) => boolean;
  };
}

export const config: AppConfig = {
  name: 'Amina',
  icon: AminaIcon,
  inviteUrl:
    'https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands',
  guild: {
    // Filter guilds where user has MANAGE_GUILD or ADMINISTRATOR permission
    filter: (guild) => {
      const permissions = BigInt(guild.permissions || '0');
      const MANAGE_GUILD = BigInt(PermissionFlags.MANAGE_GUILD);
      const ADMINISTRATOR = BigInt(PermissionFlags.ADMINISTRATOR);
      return (
        (permissions & MANAGE_GUILD) === MANAGE_GUILD ||
        (permissions & ADMINISTRATOR) === ADMINISTRATOR
      );
    },
  },
};
