import { StringSelectMenuInteraction, ButtonInteraction } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { closeAllTickets } from '@handlers/ticket/shared/utils'
import { Logger } from '@helpers/Logger'

/**
 * Show confirmation for close all operation
 */
export async function showCloseAllConfirmation(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = MinaEmbed.warning()
    .setAuthor({ name: 'confirm close all tickets' })
    .setDescription(
      '**warning:** this will close all open tickets in this server.\n\n' +
        'this is a destructive operation that cannot be undone.\n' +
        'all ticket channels will be archived and deleted.\n' +
        'transcripts will be saved to the log channel if configured.\n\n' +
        'are you sure you want to proceed?'
    )
    .setFooter({ text: 'this action affects all open tickets' })

  const buttonRow = MinaRows.from(
    MinaButtons.stop('ticket:btn:closeall_confirm').setLabel(
      'confirm close all'
    ),
    MinaButtons.nah('ticket:btn:closeall_cancel')
  )

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}

/**
 * Handle close all confirmation
 */
export async function handleCloseAllConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const loadingEmbed = MinaEmbed.primary(
    'closing all tickets... this may take a moment.'
  )

  await interaction.editReply({
    embeds: [loadingEmbed],
    components: [],
  })

  // Close all tickets
  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('Unable to close tickets: guild not found.')],
      components: [],
    })
    return
  }

  let stats!: [number, number]
  try {
    stats = await closeAllTickets(guild, interaction.user)
  } catch (error) {
    Logger.error('Failed to close all tickets', error)
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          'Failed to close tickets: an unexpected error occurred.'
        ),
      ],
      components: [],
    })
    return
  }
  const [successCount, failedCount] = stats

  const resultEmbed =
    successCount > 0 ? MinaEmbed.success() : MinaEmbed.warning()
  resultEmbed
    .setAuthor({ name: 'close all tickets complete' })
    .setDescription(
      `bulk ticket closure completed.\n\n` +
        `**successfully closed:** ${successCount}\n` +
        `**failed:** ${failedCount}\n\n` +
        (successCount > 0
          ? 'all tickets have been archived and deleted.'
          : 'no tickets were found or all closures failed.')
    )

  const backRow = MinaRows.backRow('ticket:btn:back_manage')

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [backRow],
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
