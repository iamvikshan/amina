import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
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
    .setTitle('Set Ticket Limit')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('limit')
          .setLabel('Maximum Open Tickets Per User')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter a number (minimum: 5)')
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
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            '❌ Invalid input! Please enter a valid number.\n\n' +
              'Try the command again and enter a number like `5`, `10`, or `15`.'
          ),
      ],
    })
    return
  }

  if (limit < 5) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            '❌ Ticket limit cannot be less than 5.\n\n' +
              'Please set a limit of at least 5 open tickets per user.'
          ),
      ],
    })
    return
  }

  if (limit > 100) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            '❌ Ticket limit cannot exceed 100.\n\n' +
              'Please set a reasonable limit to avoid spam.'
          ),
      ],
    })
    return
  }

  // Update settings
  const settings = await getSettings(interaction.guild!)
  settings.ticket.limit = limit
  await updateSettings(interaction.guild!.id, settings)

  const successEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `Configuration saved! Users can now have a maximum of \`${limit}\` open tickets. 🎉\n\n` +
        'This limit helps prevent spam and keeps your support system organized.'
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_setup',
    label: 'Back to Setup',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backButton],
  })
}
