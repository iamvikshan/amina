import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show modal for ticket limit input
 */
export async function showLimitModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild!)
  const currentLimit = settings.ticket.limit || 10

  const modal = new ModalBuilder()
    .setCustomId('ticket:modal:limit')
    .setTitle('set ticket limit')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('limit')
          .setLabel('maximum open tickets per user')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('enter a number (minimum: 5)')
          .setValue(currentLimit.toString())
          .setRequired(true)
          .setMaxLength(3)
      )
    )

  await interaction.showModal(modal)
}

/**
 * Handle ticket limit modal submission
 */
export async function handleLimitModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const limitInput = interaction.fields.getTextInputValue('limit')
  const limit = parseInt(limitInput, 10)

  // Validate input
  if (isNaN(limit)) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          'invalid input. please enter a valid number.\n\n' +
            'try the command again and enter a number like `5`, `10`, or `15`.'
        ),
      ],
    })
    return
  }

  if (limit < 5) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          'ticket limit cannot be less than 5.\n\n' +
            'please set a limit of at least 5 open tickets per user.'
        ),
      ],
    })
    return
  }

  if (limit > 100) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          'ticket limit cannot exceed 100.\n\n' +
            'please set a reasonable limit to avoid spam.'
        ),
      ],
    })
    return
  }

  // Update settings
  const settings = await getSettings(interaction.guild!)
  settings.ticket.limit = limit
  await updateSettings(interaction.guild!.id, settings)

  const successEmbed = MinaEmbed.success(
    `configuration saved. users can now have a maximum of \`${limit}\` open tickets.\n\n` +
      'this limit helps prevent spam and keeps your support system organized.'
  )

  const backRow = MinaRows.backRow('ticket:btn:back_setup')

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backRow],
  })
}
