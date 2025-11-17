/* eslint-disable @typescript-eslint/no-unused-vars */
// Global type definitions for the Amina Discord Bot
// These types are available globally without imports

import type {
  Client,
  Collection,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  PermissionResolvable,
  ApplicationCommandOptionData,
  ApplicationCommandType,
  ColorResolvable,
} from 'discord.js'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string
      MONGO_CONNECTION: string
      DEV_ID: string
      LOGS_WEBHOOK?: string
      GLOBAL?: string
      DASH?: string
      PORT?: string
      GITHUB_TOKEN?: string
      GITHUB_OWNER?: string
      GITHUB_REPO?: string
      LAVALINK_HOST?: string
      LAVALINK_PORT?: string
      LAVALINK_PASSWORD?: string
      BROWSER?: string
    }
  }

  // ============================================================================
  // Button Creation Helpers
  // ============================================================================

  interface ButtonOptions {
    customId: string
    label: string
    emoji?: string
    disabled?: boolean
  }

  interface LinkButtonOptions {
    url: string
    label: string
    emoji?: string
    disabled?: boolean
  }
}

declare module '@structures/Command' {
  interface Validation {
    callback: (interaction: any) => boolean
    message: string
  }

  interface SubCommand {
    trigger: string
    description: string
  }

  type CommandCategory =
    | 'ADMIN'
    | 'ANIME'
    | 'AUTOMOD'
    | 'ECONOMY'
    | 'FUN'
    | 'IMAGE'
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
    | 'GIVEAWAY'

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
    interactionRun: (
      interaction: ChatInputCommandInteraction,
      data: any
    ) => Promise<void> | void
  }

  const command: CommandData
  export = command
}

declare module '@structures/BaseContext' {
  interface ContextData {
    name: string
    description: string
    type: ApplicationCommandType
    enabled?: boolean
    ephemeral?: boolean
    defaultPermission?: boolean
    userPermissions?: PermissionResolvable[]
    cooldown?: number
    run: (interaction: ContextMenuCommandInteraction) => Promise<void> | void
  }

  const context: ContextData
  export = context
}

declare module '@structures/BotClient' {
  import { Client } from 'discord.js'

  export class BotClient extends Client {
    config: any
    logger: any
    wait: (ms: number) => Promise<void>
    slashCommands: Collection<string, any>
    contextMenus: Collection<string, any>
    schemas: any
    musicManager: any
    giveawaysManager: any
    discordTogether: any

    loadEvents(directory: string): void
    loadCommand(cmd: any): void
    loadCommands(directory: string): Promise<void>
    loadContexts(directory: string): void
    registerInteractions(guildId?: string): Promise<void>
    resolveUsers(search: string, exact?: boolean): Promise<any[]>
    getInvite(): string
  }
}

declare module '@src/config' {
  interface Config {
    INTERACTIONS: {
      SLASH: string
      CONTEXT: string
      GLOBAL: boolean
    }
    CACHE_SIZE: {
      GUILDS: number
      USERS: number
      MEMBERS: number
    }
    MESSAGES: {
      API_ERROR: string
    }
    FEEDBACK: {
      ENABLED: boolean
      URL?: string
    }
    AUTOMOD: {
      ENABLED: boolean
      LOG_EMBED: string
      DM_EMBED: string
    }
    DASHBOARD: {
      enabled: boolean
      port: string
    }
    ECONOMY: {
      ENABLED: boolean
      CURRENCY: string
      DAILY_COINS: number
      MIN_BEG_AMOUNT: number
      MAX_BEG_AMOUNT: number
    }
    MUSIC: {
      ENABLED: boolean
      IDLE_TIME: number
      DEFAULT_VOLUME: number
      MAX_SEARCH_RESULTS: number
      DEFAULT_SOURCE: string
      LAVALINK_NODES: any[]
    }
    STATS: {
      ENABLED: boolean
      XP_COOLDOWN: number
      DEFAULT_LVL_UP_MSG: string
    }
    GIVEAWAYS: {
      ENABLED: boolean
    }
    IMAGE: {
      ENABLED: boolean
      BASE_API: string
    }
    INVITE: {
      ENABLED: boolean
    }
    SUGGESTIONS: {
      ENABLED: boolean
      EMOJI: {
        UP_VOTE: string
        DOWN_VOTE: string
      }
      DEFAULT_EMBED: ColorResolvable
      APPROVED_EMBED: ColorResolvable
      DENIED_EMBED: ColorResolvable
    }
    TICKET: {
      ENABLED: boolean
      CREATE_EMBED: ColorResolvable
      CLOSE_EMBED: ColorResolvable
    }
    EMBED_COLORS: {
      BOT_EMBED: ColorResolvable
      TRANSPARENT: ColorResolvable
      SUCCESS: ColorResolvable
      ERROR: ColorResolvable
      WARNING: ColorResolvable
    }
    MODERATION: {
      ENABLED: boolean
      EMBED_COLORS: {
        TIMEOUT: ColorResolvable
        UNTIMEOUT: ColorResolvable
        KICK: ColorResolvable
        SOFTBAN: ColorResolvable
        BAN: ColorResolvable
        UNBAN: ColorResolvable
        VMUTE: ColorResolvable
        VUNMUTE: ColorResolvable
        DEAFEN: ColorResolvable
        UNDEAFEN: ColorResolvable
        DISCONNECT: ColorResolvable
        MOVE: ColorResolvable
      }
    }
  }

  const config: Config
  export = config
}

// Helper type utilities
declare module '@helpers/Logger' {
  interface Logger {
    log(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
    debug(message: string, ...args: any[]): void
    success(message: string, ...args: any[]): void
  }
  const logger: Logger
  export = logger
}

// Discord.js prototype extensions
declare module 'discord.js' {
  import type { MessagePayload, MessageCreateOptions, MessageReplyOptions } from 'discord.js'

  interface Guild {
    findMatchingChannels(query: string, type?: any[]): any[]
    findMatchingVoiceChannels(query: string, type?: any[]): any[]
    findMatchingRoles(query: string): any[]
    resolveMember(query: string, exact?: boolean): Promise<any>
    fetchMemberStats(): Promise<number[]>
  }

  interface GuildChannel {
    canSendEmbeds(): boolean
    safeSend(
      content: string | MessagePayload | MessageCreateOptions,
      seconds?: number
    ): Promise<any>
  }

  interface Message {
    safeReply(
      content: string | MessagePayload | MessageReplyOptions,
      seconds?: number
    ): Promise<any>
  }
}

// Admin handler types
declare module '@handlers/admin' {
  import type {
    StringSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    RoleSelectMenuInteraction,
    ButtonInteraction,
  } from 'discord.js'

  export interface AdminHandlers {
    handleAdminCategoryMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleServerSettingsMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleMinaAIMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleLoggingMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleChannelSelect: (interaction: ChannelSelectMenuInteraction) => Promise<void>
    handleRoleSelect: (interaction: RoleSelectMenuInteraction) => Promise<void>
    handleAdminBackButton: (interaction: ButtonInteraction) => Promise<void>
  }

  export type AdminMenuAction =
    | 'settings'
    | 'minaai'
    | 'logs'
    | 'status'
    | 'back'
    | 'updateschannel'
    | 'staffadd'
    | 'staffremove'
    | 'toggle'
    | 'freewill'
    | 'mentiononly'
    | 'dms'
    | 'setchannel'
    | 'toggleall'

  export type AdminChannelSelectType = 'updateschannel' | 'freewill' | 'logchannel'
  export type AdminRoleSelectType = 'staffadd' | 'staffremove'
}

// Role handler types
declare module '@handlers/roles' {
  import type {
    StringSelectMenuInteraction,
    RoleSelectMenuInteraction,
    ModalSubmitInteraction,
    ButtonInteraction,
    Role,
  } from 'discord.js'

  export interface RoleCleanupStats {
    matched: Role[]
    deletable: Role[]
    skipped: Array<{ role: Role; reason: string }>
  }

  export type RoleCleanupMethod = 'empty' | 'prefix' | 'below' | 'older'

  export interface RoleCleanupParams {
    method: RoleCleanupMethod
    prefix?: string
    position?: number
    days?: number
    keepIds?: Set<string>
  }

  export interface RoleHandlers {
    handleRolesOperationMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleRolesCleanupMethodMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleRolesBackButton: (interaction: ButtonInteraction) => Promise<void>
    handleRoleCleanupModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleRoleCleanupKeepSelect: (interaction: RoleSelectMenuInteraction) => Promise<void>
    handleRoleCleanupConfirm: (interaction: ButtonInteraction) => Promise<void>
    handleRoleCleanupCancel: (interaction: ButtonInteraction) => Promise<void>
  }

  export type RoleOperation = 'cleanup' | 'create' | 'autorole' | 'add2user'
}

// Ticket handler types
declare module '@handlers/ticket' {
  import type {
    StringSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    UserSelectMenuInteraction,
    ModalSubmitInteraction,
    ButtonInteraction,
  } from 'discord.js'

  export interface TicketHandlers {
    handleTicketCategoryMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleTicketBackButton: (interaction: ButtonInteraction) => Promise<void>
    handleSetupMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleManageMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleTopicsMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleMessageChannelSelect: (interaction: ChannelSelectMenuInteraction) => Promise<void>
    handleLogChannelSelect: (interaction: ChannelSelectMenuInteraction) => Promise<void>
    handleTicketMessageModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleLimitModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleAddTopicModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleRemoveTopicSelect: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleRemoveTopicConfirm: (interaction: ButtonInteraction) => Promise<void>
    handleRemoveTopicCancel: (interaction: ButtonInteraction) => Promise<void>
    handleBackToTopics: (interaction: ButtonInteraction) => Promise<void>
    handleCloseTicket: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleCloseAllConfirm: (interaction: ButtonInteraction) => Promise<void>
    handleCloseAllCancel: (interaction: ButtonInteraction) => Promise<void>
    handleAddUserSelect: (interaction: UserSelectMenuInteraction) => Promise<void>
    handleRemoveUserSelect: (interaction: UserSelectMenuInteraction) => Promise<void>
  }

  export type TicketCategory = 'setup' | 'manage'
  export type TicketSetupOption = 'message' | 'log' | 'limit' | 'topics'
  export type TicketManageOption = 'close' | 'closeall' | 'add' | 'remove'
  export type TicketTopicsOption = 'list' | 'add' | 'remove'
}

export {}
