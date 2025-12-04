// Context menu command type definitions

import type {
  ContextMenuCommandInteraction,
  PermissionResolvable,
  ApplicationCommandType,
} from 'discord.js'

declare global {
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
}

// Module augmentation for @structures/BaseContext
declare module '@structures/BaseContext' {
  const context: ContextData
  export = context
}

export {}

