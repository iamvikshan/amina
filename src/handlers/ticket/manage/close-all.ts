import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createDangerBtn, createSecondaryBtn } from '@helpers/componentHelper'
import { closeAllTickets } from '@handlers/ticket/shared/utils'

/**
 * Show confirmation for close all operation
 */
export async function showCloseAllConfirmation(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setAuthor({ name: '⚠️ Confirm Close All Tickets' })
    .setDescription(
      '**Warning:** This will close ALL open tickets in this server!\n\n' +
        '⚠️ This is a destructive operation that cannot be undone.\n' +
        '📊 All ticket channels will be archived and deleted.\n' +
        '📝 Transcripts will be saved to the log channel if configured.\n\n' +
        'Are you sure you want to proceed?'
    )
    .setFooter({ text: 'This action affects all open tickets' })

  const confirmButton = createDangerBtn({
    customId: 'ticket:btn:closeall_confirm',
    label: 'Confirm Close All',
    emoji: '⚠️',
  })

  const cancelButton = createSecondaryBtn({
    customId: 'ticket:btn:closeall_cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [confirmButton.components[0], cancelButton.components[0]],
      },
    ],
  })
}

/**
 * Handle close all confirmation
 */
export async function handleCloseAllConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const loadingEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription('⏳ Closing all tickets... This may take a moment.')

  await interaction.editReply({
    embeds: [loadingEmbed],
    components: [],
  })

  // Close all tickets
  const stats = await closeAllTickets(interaction.guild!, interaction.user)
  const [successCount, failedCount] = stats

  const resultEmbed = new EmbedBuilder()
    .setColor(successCount > 0 ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
    .setAuthor({ name: '✅ Close All Tickets Complete' })
    .setDescription(
      `Bulk ticket closure completed!\n\n` +
        `✅ **Successfully Closed:** ${successCount}\n` +
        `❌ **Failed:** ${failedCount}\n\n` +
        (successCount > 0
          ? 'All tickets have been archived and deleted.'
          : 'No tickets were found or all closures failed.')
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_manage',
    label: 'Back to Manage',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [backButton],
  })
}

/**
 * Handle close all cancellation
 */
export async function handleCloseAllCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const { showManageMenu } = await import('./menu')
  await showManageMenu(interaction as any)
}
