import {
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} from 'discord.js'
import type { PurgeType } from './amount-select'

/**
 * Show custom amount modal
 */
export async function showAmountModal(
  interaction: StringSelectMenuInteraction,
  purgeType: PurgeType,
  additionalData?: { token?: string; userId?: string }
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId(
      `purge:modal:amount|type:${purgeType}${
        additionalData?.token
          ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
          : ''
      }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`
    )
    .setTitle('Custom Amount')

  const amountInput = new TextInputBuilder()
    .setCustomId('amount')
    .setLabel('Number of messages (1-100)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter a number between 1 and 100')
    .setRequired(true)
    .setMaxLength(3)

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
    amountInput
  )
  modal.addComponents(row)

  await interaction.showModal(modal)
}

/**
 * Handle amount modal submission
 */
export async function handleAmountModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const amountStr = interaction.fields.getTextInputValue('amount')
  const amount = parseInt(amountStr, 10)

  // Validate amount
  if (isNaN(amount) || amount < 1 || amount > 100) {
    await interaction.reply({
      content: '❌ Invalid amount. Please enter a number between 1 and 100.',
      ephemeral: true,
    })
    return
  }

  // Parse state from custom_id
  const customId = interaction.customId
  const parts = customId.split('|')
  const typePart = parts.find(p => p.startsWith('type:'))
  const tokenPart = parts.find(p => p.startsWith('token:'))
  const userPart = parts.find(p => p.startsWith('user:'))

  const purgeType = typePart?.split(':')[1] as PurgeType
  const token = tokenPart
    ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
    : undefined
  const userId = userPart?.split(':')[1]

  await interaction.deferReply({ ephemeral: false })

  // Proceed to channel selection (optional)
  const { showChannelSelect } = await import('./channel-select')
  await showChannelSelect(interaction, purgeType, amount, { token, userId })
}
