import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  TextChannel,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { isTicketChannel, closeTicket } from '@handlers/ticket/shared/utils'

/**
 * Handle close ticket operation
 */
export async function handleCloseTicket(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const channel = interaction.channel as TextChannel

  // Check if in ticket channel
  if (!isTicketChannel(channel)) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        '❌ This command can only be used in ticket channels!\n\n' +
          'Please run this command from within an active ticket channel.'
      )

    const backButton = createSecondaryBtn({
      customId: 'ticket:btn:back_manage',
      label: 'Back to Manage',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [embed],
      components: [backButton],
    })
    return
  }

  // Attempt to close ticket
  const status = await closeTicket(
    channel,
    interaction.user,
    'Closed by a moderator'
  )

  if (status === 'MISSING_PERMISSIONS') {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        "❌ I don't have permission to close tickets!\n\n" +
          'Please make sure I have the **Manage Channels** permission.'
      )

    const backButton = createSecondaryBtn({
      customId: 'ticket:btn:back_manage',
      label: 'Back to Manage',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [embed],
      components: [backButton],
    })
    return
  }

  if (status === 'ERROR') {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        '❌ An error occurred while closing the ticket.\n\n' +
          'Please try again or contact a server administrator.'
      )

    const backButton = createSecondaryBtn({
      customId: 'ticket:btn:back_manage',
      label: 'Back to Manage',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [embed],
      components: [backButton],
    })
    return
  }

  // Success - channel will be deleted, no need to reply
  // The closeTicket function handles the deletion
}
