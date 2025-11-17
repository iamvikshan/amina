import { ChatInputCommandInteraction } from 'discord.js'
import { TICKET } from '@src/config'
import type { CommandData } from '@src/structures/Command'
import { showTicketHub } from '@handlers/ticket/index'

const command: CommandData = {
  name: 'ticket',
  description: 'Manage ticket system with guided setup and runtime operations',
  category: 'TICKET',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: TICKET.ENABLED,
    ephemeral: true,
    options: [],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: any
  ): Promise<void> {
    // Command handler already defers the reply, so we can use editReply
    // Show main ticket hub
    await showTicketHub(interaction as any)
  },
}

export default command
