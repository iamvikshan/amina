import {
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn, createPrimaryBtn } from '@helpers/componentHelper'
import type { PurgeType } from './amount-select'

/**
 * Show optional channel selection
 */
export async function showChannelSelect(
  interaction:
    | StringSelectMenuInteraction
    | ModalSubmitInteraction
    | ButtonInteraction,
  purgeType: PurgeType,
  amount: number,
  additionalData?: { token?: string; userId?: string },
  isManualSelection?: boolean // true if user manually selected amount (not default flow)
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('📺 Channel Selection')
    .setDescription(
      'Select a channel to purge messages from, or use the current channel.\n\n' +
        `**Type:** ${getPurgeTypeLabel(purgeType)}\n` +
        `**Amount:** ${amount} messages\n` +
        (additionalData?.token ? `**Token:** ${additionalData.token}\n` : '') +
        (additionalData?.userId
          ? `**User:** <@${additionalData.userId}>\n`
          : '')
    )
    .setFooter({ text: 'Select a channel or use current channel' })

  const menu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(
        `purge:channel:select|type:${purgeType}|amount:${amount}${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`
      )
      .setPlaceholder('📺 Select a channel (optional)')
      .setChannelTypes([ChannelType.GuildText])
  )

  const components: any[] = [menu]

  // For default flow (isManualSelection = false), show Proceed button instead of "Use Current Channel"
  // For manual selection, show "Use Current Channel" button
  if (isManualSelection !== false) {
    // Manual selection - show "Use Current Channel" button
    const useCurrentButton = createPrimaryBtn({
      customId: `purge:btn:use_current|type:${purgeType}|amount:${amount}${
        additionalData?.token
          ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
          : ''
      }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`,
      label: 'Use Current Channel',
      emoji: '✅',
    })
    components.push(useCurrentButton)
  } else {
    // Default flow - show Proceed button (current channel is preselected)
    const proceedButton = createPrimaryBtn({
      customId: `purge:btn:proceed_channel|type:${purgeType}|amount:${amount}${
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
    label: 'Back',
    emoji: '◀️',
  })
  components.push(backButton)

  await interaction.editReply({
    embeds: [embed],
    components,
  })
}

/**
 * Handle channel selection
 */
export async function handleChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  const channelId = interaction.values[0]
  const channel = interaction.guild?.channels.cache.get(channelId)

  if (!channel || !channel.isTextBased()) {
    await interaction.followUp({
      content: '❌ Invalid channel selected.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  // Parse state from custom_id
  const customId = interaction.customId
  const parts = customId.split('|')
  const typePart = parts.find(p => p.startsWith('type:'))
  const amountPart = parts.find(p => p.startsWith('amount:'))
  const tokenPart = parts.find(p => p.startsWith('token:'))
  const userPart = parts.find(p => p.startsWith('user:'))

  const purgeType = typePart?.split(':')[1] as PurgeType
  const amount = parseInt(amountPart?.split(':')[1] || '100', 10)
  const token = tokenPart
    ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
    : undefined
  const userId = userPart?.split(':')[1]

  // Proceed to preview
  const { showPurgePreview } = await import('../preview')
  await showPurgePreview(interaction, purgeType, amount, channelId, {
    token,
    userId,
  })
}

/**
 * Handle "use current channel" button
 */
export async function handleUseCurrentChannel(
  interaction: ButtonInteraction
): Promise<void> {
  const channelId = interaction.channelId

  if (!channelId) {
    await interaction.followUp({
      content: '❌ Could not determine current channel.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  // Parse state from custom_id
  const customId = interaction.customId
  const parts = customId.split('|')
  const typePart = parts.find(p => p.startsWith('type:'))
  const amountPart = parts.find(p => p.startsWith('amount:'))
  const tokenPart = parts.find(p => p.startsWith('token:'))
  const userPart = parts.find(p => p.startsWith('user:'))

  const purgeType = typePart?.split(':')[1] as PurgeType
  const amount = parseInt(amountPart?.split(':')[1] || '100', 10)
  const token = tokenPart
    ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
    : undefined
  const userId = userPart?.split(':')[1]

  // Proceed to preview
  const { showPurgePreview } = await import('../preview')
  await showPurgePreview(interaction, purgeType, amount, channelId, {
    token,
    userId,
  })
}

/**
 * Handle "proceed channel" button for default flow
 */
export async function handleProceedChannel(
  interaction: ButtonInteraction
): Promise<void> {
  const channelId = interaction.channelId

  if (!channelId) {
    await interaction.followUp({
      content: '❌ Could not determine current channel.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  // Parse state from custom_id
  const customId = interaction.customId
  const parts = customId.split('|')
  const typePart = parts.find(p => p.startsWith('type:'))
  const amountPart = parts.find(p => p.startsWith('amount:'))
  const tokenPart = parts.find(p => p.startsWith('token:'))
  const userPart = parts.find(p => p.startsWith('user:'))

  const purgeType = typePart?.split(':')[1] as PurgeType
  const amount = parseInt(amountPart?.split(':')[1] || '100', 10)
  const token = tokenPart
    ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
    : undefined
  const userId = userPart?.split(':')[1]

  // Proceed to preview
  const { showPurgePreview } = await import('../preview')
  await showPurgePreview(interaction, purgeType, amount, channelId, {
    token,
    userId,
  })
}

/**
 * Get human-readable label for purge type
 */
function getPurgeTypeLabel(type: PurgeType): string {
  const labels: Record<PurgeType, string> = {
    all: 'All Messages',
    attachments: 'Messages with Attachments',
    bots: 'Bot Messages',
    links: 'Messages with Links',
    token: 'Messages with Token/Keyword',
    user: 'User Messages',
  }
  return labels[type]
}
