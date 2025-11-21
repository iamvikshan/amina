// src/structures/BaseContext.ts
import {
  ApplicationCommandType,
  ContextMenuCommandInteraction,
} from 'discord.js'
import type { PermissionResolvable } from 'discord.js'

// All types are now globally available - see types/contexts.d.ts
// This file only exports the runtime context template

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
