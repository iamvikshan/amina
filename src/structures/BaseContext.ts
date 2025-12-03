// src/structures/BaseContext.ts
import { ApplicationCommandType } from 'discord.js'

// All types are now globally available - see types/contexts.d.ts
// This file only exports the runtime context template

/**
 * Default context menu command template
 */
const baseContext: ContextData = {
  name: '',
  description: '',
  type: ApplicationCommandType.User,
  enabled: false,
  ephemeral: false,
  userPermissions: [],
  cooldown: 0,
  run: async () => {},
}

export default baseContext
