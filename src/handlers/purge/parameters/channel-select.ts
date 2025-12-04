import {
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ButtonStyle,
} from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
// PurgeType is now globally available - see types/handlers.d.ts

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
  const embed = MinaEmbed.primary()
    .setTitle('channel selection')
    .setDescription(
      'select a channel to purge messages from, or use the current channel.\n\n' +
        `**type:** ${getPurgeTypeLabel(purgeType)}\n` +
        `**amount:** ${amount} messages\n` +
        (additionalData?.token ? `**token:** ${additionalData.token}\n` : '') +
        (additionalData?.userId
          ? `**user:** <@${additionalData.userId}>\n`
          : '')
    )
    .setFooter({ text: 'select a channel or use current channel' })

  const menu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(
        `purge:channel:select|type:${purgeType}|amount:${amount}${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`
      )
      .setPlaceholder('select a channel (optional)')
      .setChannelTypes([ChannelType.GuildText])
  )

  const components: any[] = [menu]

  // For default flow (isManualSelection = false), show Proceed button instead of "Use Current Channel"
  // For manual selection, show "Use Current Channel" button
  if (isManualSelection !== false) {
    // Manual selection - show "Use Current Channel" button
    const useCurrentRow = MinaRows.single(
      MinaButtons.custom(
        `purge:btn:use_current|type:${purgeType}|amount:${amount}${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`,
        'use current channel',
        ButtonStyle.Primary
      )
    )
    components.push(useCurrentRow)
  } else {
    // Default flow - show Proceed button (current channel is preselected)
    const proceedRow = MinaRows.single(
      MinaButtons.custom(
        `purge:btn:proceed_channel|type:${purgeType}|amount:${amount}${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`,
        'proceed',
        ButtonStyle.Primary
      )
    )
    components.push(proceedRow)
  }

  const backRow = MinaRows.backRow('purge:btn:back')
  components.push(backRow)

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
      content: 'invalid channel selected.',
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
      content: 'could not determine current channel.',
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
      content: 'could not determine current channel.',
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
    all: 'all messages',
    attachments: 'messages with attachments',
    bots: 'bot messages',
    links: 'messages with links',
    token: 'messages with token/keyword',
    user: 'user messages',
  }
  return labels[type]
}
