// src/structures/Command.ts
import { ChatInputCommandInteraction } from 'discord.js'

// All types are now globally available - see types/commands.d.ts
// This file only exports the runtime command template

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
