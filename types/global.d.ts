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
      NODES: any[]
    }
    STATS: {
      ENABLED: boolean
      XP_COOLDOWN: number
      DEFAULT_LVL_UP_MSG: string
    }
    GIVEAWAYS: {
      ENABLED: boolean
    }
    EMBED_COLORS: {
      BOT_EMBED: string
      TRANSPARENT: string
      SUCCESS: string
      ERROR: string
      WARNING: string
    }
  }

  const config: Config
  export = config
}

// Helper type utilities
declare module '@helpers/Utils' {
  class Utils {
    static containsLink(text: string): boolean
    static containsDiscordInvite(text: string): boolean
    static getRandomInt(max: number): number
    static isHex(text: string): boolean
    static isValidColor(text: string): boolean
    static diffHours(dt: Date, now: Date): number
    static timeformat(timeInSeconds: number): string
    static daysAgo(d: Date): number
    static getRemainingTime(timeUntil: number): string
    static parsePermissions(perms: string[]): string
    static recursiveReadDirSync(dir: string): string[]
  }
  export = Utils
}

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

export {}

