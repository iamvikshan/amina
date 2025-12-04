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
  const tokenInput = new TextInputBuilder({
    customId: 'token',
    label: 'keyword or token',
    style: TextInputStyle.Short,
    placeholder: 'enter the keyword to search for (case-insensitive)',
    required: true,
    maxLength: 100,
  })

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(tokenInput)

  const modal = new ModalBuilder({
    customId: 'purge:modal:token',
    title: 'enter keyword/token',
    components: [row],
  })

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
      content: 'please enter a valid keyword or token.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply({ ephemeral: false })

  // Proceed to amount selection
  const { showAmountSelect } = await import('./amount-select')
  await showAmountSelect(interaction, 'token', { token })
}
