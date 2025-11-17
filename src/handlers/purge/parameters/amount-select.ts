import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn, createPrimaryBtn } from '@helpers/componentHelper'

export type PurgeType =
  | 'all'
  | 'attachments'
  | 'bots'
  | 'links'
  | 'token'
  | 'user'

/**
 * Show amount selection menu
 */
export async function showAmountSelect(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ModalSubmitInteraction,
  purgeType: PurgeType,
  additionalData?: { token?: string; userId?: string },
  isDefault?: boolean
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('📊 Select Amount')
    .setDescription(
      'Choose how many messages to delete:\n\n' +
        '**Presets:**\n' +
        '• 10 messages\n' +
        '• 25 messages\n' +
        '• 50 messages\n' +
        '• 100 messages (Discord max per operation)\n' +
        '• Custom (1-100)\n\n' +
        '⚠️ **Note:** Maximum 500 messages per command execution.'
    )
    .setFooter({ text: 'Select an amount or choose custom' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(
        `purge:menu:amount|type:${purgeType}${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}${isDefault ? '|default:true' : ''}`
      )
      .setPlaceholder('🔢 Select amount...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('10 Messages')
          .setDescription('Delete 10 messages')
          .setValue('10')
          .setEmoji('🔟'),
        new StringSelectMenuOptionBuilder()
          .setLabel('25 Messages')
          .setDescription('Delete 25 messages')
          .setValue('25')
          .setEmoji('2️⃣'),
        new StringSelectMenuOptionBuilder()
          .setLabel('50 Messages')
          .setDescription('Delete 50 messages')
          .setValue('50')
          .setEmoji('5️⃣'),
        new StringSelectMenuOptionBuilder()
          .setLabel('100 Messages')
          .setDescription('Delete 100 messages (Discord max)')
          .setValue('100')
          .setEmoji('💯')
          .setDefault(isDefault === true), // Preselect 100 for default flow
        new StringSelectMenuOptionBuilder()
          .setLabel('Custom Amount')
          .setDescription('Enter a custom amount (1-100)')
          .setValue('custom')
          .setEmoji('✏️'),
      ])
  )

  const components: any[] = [menu]

  // Add Proceed button for default flow (100 preselected)
  if (isDefault) {
    const proceedButton = createPrimaryBtn({
      customId: `purge:btn:proceed_amount|type:${purgeType}|amount:100${
        additionalData?.token
          ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
          : ''
      }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`,
      label: 'Proceed',
      emoji: '➡️',
    })
    components.push(proceedButton)
  }

  const backButton = createSecondaryBtn({
    customId: 'purge:btn:back',
    label: 'Back to Type Selection',
    emoji: '◀️',
  })
  components.push(backButton)

  await interaction.editReply({
    embeds: [embed],
    components,
  })
}

/**
 * Handle amount selection
 */
export async function handleAmountSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const selected = interaction.values[0]
  const customId = interaction.customId

  // Parse state from custom_id
  const parts = customId.split('|')
  const typePart = parts.find(p => p.startsWith('type:'))
  const tokenPart = parts.find(p => p.startsWith('token:'))
  const userPart = parts.find(p => p.startsWith('user:'))
  const isDefault = parts.some(p => p === 'default:true')

  const purgeType = typePart?.split(':')[1] as PurgeType
  const token = tokenPart
    ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
    : undefined
  const userId = userPart?.split(':')[1]

  if (selected === 'custom') {
    // Show modal for custom amount
    const { showAmountModal } = await import('./amount-modal')
    await showAmountModal(interaction, purgeType, { token, userId })
    return
  }

  const amount = parseInt(selected, 10)

  // Validate amount
  if (amount < 1 || amount > 100) {
    await interaction.followUp({
      content: '❌ Invalid amount. Please select between 1-100 messages.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  // Proceed to channel selection (optional)
  // If user manually selected (not default), pass isDefault=false
  const { showChannelSelect } = await import('./channel-select')
  await showChannelSelect(
    interaction,
    purgeType,
    amount,
    { token, userId },
    !isDefault
  )
}
