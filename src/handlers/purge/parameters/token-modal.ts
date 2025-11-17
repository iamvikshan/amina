import {
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} from 'discord.js'

/**
 * Show token/keyword input modal
 */
export async function showTokenModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('purge:modal:token')
    .setTitle('Enter Keyword/Token')

  const tokenInput = new TextInputBuilder()
    .setCustomId('token')
    .setLabel('Keyword or Token')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the keyword to search for (case-insensitive)')
    .setRequired(true)
    .setMaxLength(100)

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(tokenInput)
  modal.addComponents(row)

  await interaction.showModal(modal)
}

/**
 * Handle token modal submission
 */
export async function handleTokenModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const token = interaction.fields.getTextInputValue('token').trim()

  if (!token || token.length === 0) {
    await interaction.reply({
      content: '❌ Please enter a valid keyword or token.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply({ ephemeral: false })

  // Proceed to amount selection
  const { showAmountSelect } = await import('./amount-select')
  await showAmountSelect(interaction, 'token', { token })
}
