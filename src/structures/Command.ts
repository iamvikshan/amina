// src/structures/Command.ts

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
