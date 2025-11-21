/* eslint-disable @typescript-eslint/no-unused-vars */
// Command type definitions

import type {
  ChatInputCommandInteraction,
  PermissionResolvable,
  ApplicationCommandOptionData,
} from 'discord.js'

declare global {
  type CommandCategory =
    | 'ADMIN'
    | 'ANIME'
    | 'AUTOMOD'
    | 'ECONOMY'
    | 'FUN'
    | 'GIVEAWAY'
    | 'IMAGE'
    | 'INFO'
    | 'INFORMATION'
    | 'INVITE'
    | 'MODERATION'
    | 'ERELA_JS'
    | 'NONE'
    | 'DEV'
    | 'SOCIAL'
    | 'SUGGESTION'
    | 'TICKET'
    | 'UTILITY'
    | 'MUSIC'

  interface Validation {
    callback: (interaction: any) => boolean | Promise<boolean>
    message: string
  }

  interface SubCommand {
    trigger: string
    description: string
  }

  interface InteractionInfo {
    enabled: boolean
    ephemeral?: boolean
    options?: ApplicationCommandOptionData[]
  }

  interface CommandInfo {
    enabled: boolean
    aliases?: string[]
    usage?: string
    minArgsCount?: number
    subcommands?: SubCommand[]
  }

  interface CommandData {
    name: string
    description: string
    cooldown?: number
    isPremium?: boolean
    category: CommandCategory
    botPermissions?: PermissionResolvable[]
    userPermissions?: PermissionResolvable[]
    validations?: Validation[]
    command?: CommandInfo
    slashCommand: InteractionInfo
    devOnly?: boolean
    testGuildOnly?: boolean
    showsModal?: boolean
    dmCommand?: boolean
    interactionRun: (
      interaction: ChatInputCommandInteraction,
      data: any
    ) => Promise<any> | any
  }
}

// Module augmentation for @structures/Command
declare module '@structures/Command' {
  const command: CommandData
  export = command
}

export {}

