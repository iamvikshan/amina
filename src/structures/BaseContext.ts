// src/structures/BaseContext.ts
import {
  ApplicationCommandType,
  ContextMenuCommandInteraction,
  PermissionResolvable,
} from 'discord.js'

/**
 * Context menu command data structure
 */
export interface ContextData {
  /** The name of the command (must be lowercase) */
  name: string
  /** A short description of the command */
  description: string
  /** The type of application command */
  type: ApplicationCommandType | string
  /** Whether the context command is enabled or not */
  enabled?: boolean
  /** Whether the reply should be ephemeral */
  ephemeral?: boolean
  /** Whether default permission must be enabled */
  defaultPermission?: boolean
  /** Permissions required by the user to use the command */
  userPermissions?: PermissionResolvable[]
  /** Command cooldown in seconds */
  cooldown?: number
  /** The callback to be executed when the context is invoked */
  run: (interaction: ContextMenuCommandInteraction) => Promise<void> | void
}

/**
 * Default context menu command template
 */
const baseContext: ContextData = {
  name: '',
  description: '',
  type: '',
  enabled: false,
  ephemeral: false,
  userPermissions: [],
  cooldown: 0,
  run: async () => {},
}

export default baseContext
