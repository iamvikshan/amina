import { StringSelectMenuInteraction, TextChannel } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
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
    const embed = MinaEmbed.error().setDescription(
      'this command can only be used in ticket channels\n\n' +
        'please run this command from within an active ticket channel.'
    )

    const backRow = MinaRows.backRow('ticket:btn:back_manage')

    await interaction.editReply({
      embeds: [embed],
      components: [backRow],
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
    const embed = MinaEmbed.error().setDescription(
      "i don't have permission to close tickets\n\n" +
        'please make sure i have the **manage channels** permission.'
    )

    const backRow = MinaRows.backRow('ticket:btn:back_manage')

    await interaction.editReply({
      embeds: [embed],
      components: [backRow],
    })
    return
  }

  if (status === 'ERROR') {
    const embed = MinaEmbed.error().setDescription(
      'an error occurred while closing the ticket\n\n' +
        'please try again or contact a server administrator.'
    )

    const backRow = MinaRows.backRow('ticket:btn:back_manage')

    await interaction.editReply({
      embeds: [embed],
      components: [backRow],
    })
    return
  }

  // Success - channel will be deleted, no need to reply
  // The closeTicket function handles the deletion
}
