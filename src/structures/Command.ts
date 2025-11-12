// src/structures/Command.ts
import {
  ApplicationCommandOptionData,
  ChatInputCommandInteraction,
  PermissionResolvable,
} from 'discord.js'

/**
 * Command category type
 */
export type CommandCategory =
  | 'ADMIN'
  | 'ANIME'
  | 'AUTOMOD'
  | 'ECONOMY'
  | 'FUN'
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

/**
 * Validation for command execution
 */
export interface Validation {
  /** The condition to validate */
  callback: (args?: any) => boolean | Promise<boolean>
  /** The message to be displayed if callback condition is not met */
  message: string
}

/**
 * Subcommand information
 */
export interface SubCommand {
  /** Subcommand invoke trigger */
  trigger: string
  /** Subcommand description */
  description: string
}

/**
 * Slash command configuration
 */
export interface InteractionInfo {
  /** Whether the slash command is enabled or not */
  enabled: boolean
  /** Whether the reply should be ephemeral */
  ephemeral?: boolean
  /** Command options */
  options?: ApplicationCommandOptionData[]
}

/**
 * Command configuration
 */
export interface CommandInfo {
  /** Whether the command is enabled or not */
  enabled: boolean
  /** Alternative names for the command (all must be lowercase) */
  aliases?: string[]
  /** The command usage format string */
  usage?: string
  /** Minimum number of arguments the command takes (default is 0) */
  minArgsCount?: number
  /** List of subcommands */
  subcommands?: SubCommand[]
}

/**
 * Complete command data structure
 */
export interface CommandData {
  /** The name of the command (must be lowercase) */
  name: string
  /** A short description of the command */
  description: string
  /** The command cooldown in seconds */
  cooldown?: number
  /** Whether the command requires premium */
  isPremium?: boolean
  /** Whether the command is only available to bot developers */
  devOnly?: boolean
  /** Whether the command is only registered in the test guild */
  testGuildOnly?: boolean
  /** The category this command belongs to */
  category: CommandCategory
  /** Permissions required by the client to use the command */
  botPermissions?: PermissionResolvable[]
  /** Permissions required by the user to use the command */
  userPermissions?: PermissionResolvable[]
  /** List of validations to be run before the command is executed */
  validations?: Validation[]
  /** Command configuration */
  command?: CommandInfo
  /** Slash command configuration */
  slashCommand?: InteractionInfo
  /** The callback to be executed when the interaction is invoked */
  interactionRun?: (
    interaction: ChatInputCommandInteraction,
    data: any
  ) => Promise<any> | any
}

/**
 * Command type alias for convenience
 */
export type Command = CommandData

/**
 * Default command template
 */
const baseCommand: CommandData = {
  name: '',
  description: '',
  cooldown: 0,
  isPremium: false,
  category: 'NONE',
  botPermissions: [],
  userPermissions: [],
  validations: [],
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },
  interactionRun: async () => {},
}

export default baseCommand
