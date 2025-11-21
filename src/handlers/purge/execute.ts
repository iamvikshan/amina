import {
  ButtonInteraction,
  EmbedBuilder,
  TextChannel,
  GuildMember,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { purgeMessages } from '@helpers/ModUtils/purge'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Handle purge confirmation and execution
 */
export async function handlePurgeConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  // Parse state from custom_id
  const customId = interaction.customId
  const parts = customId.split('|')

  if (parts.length < 2) {
    await interaction.editReply({
      content: '❌ Invalid purge state. Please try again.',
      embeds: [],
      components: [],
    })
    return
  }

  const stateEncoded = parts[1]
  let stateData: {
    type: string
    amount: number
    channelId: string
    token?: string
    userId?: string
  }

  try {
    const decoded = Buffer.from(stateEncoded, 'base64').toString()
    stateData = JSON.parse(decoded) as typeof stateData
  } catch (error) {
    await interaction.editReply({
      content:
        '❌ Invalid purge state. The operation may have expired. Please try again.',
      embeds: [],
      components: [],
    })
    return
  }

  const { type, amount, channelId, token, userId } = stateData

  // Get channel
  const channel = interaction.guild?.channels.cache.get(channelId) as
    | TextChannel
    | undefined

  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({
      content: '❌ Invalid channel. The channel may have been deleted.',
      embeds: [],
      components: [],
    })
    return
  }

  // Check permissions
  const member = interaction.member as GuildMember
  if (
    !channel
      .permissionsFor(member)
      ?.has(['ManageMessages', 'ReadMessageHistory'])
  ) {
    await interaction.editReply({
      content: `❌ You don't have permission to manage messages in ${channel}.`,
      embeds: [],
      components: [],
    })
    return
  }

  if (
    !channel
      .permissionsFor(interaction.guild!.members.me!)
      ?.has(['ManageMessages', 'ReadMessageHistory'])
  ) {
    await interaction.editReply({
      content: `❌ I don't have permission to manage messages in ${channel}.`,
      embeds: [],
      components: [],
    })
    return
  }

  // Show loading embed
  const loadingEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription('⏳ Purging messages... This may take a moment.')

  await interaction.editReply({
    embeds: [loadingEmbed],
    components: [],
  })

  // Map purge type to helper function type
  const purgeTypeMap: Record<
    string,
    'ALL' | 'ATTACHMENT' | 'BOT' | 'LINK' | 'TOKEN' | 'USER'
  > = {
    all: 'ALL',
    attachments: 'ATTACHMENT',
    bots: 'BOT',
    links: 'LINK',
    token: 'TOKEN',
    user: 'USER',
  }

  const purgeType = purgeTypeMap[type] || 'ALL'
  const argument = token || userId

  // Execute purge
  const result = await purgeMessages(
    member,
    channel,
    purgeType,
    amount,
    argument
  )

  // Handle result
  let resultEmbed: EmbedBuilder

  if (typeof result === 'number') {
    // Success
    resultEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle('✅ Purge Complete')
      .setDescription(
        `Successfully deleted **${result}** message${result !== 1 ? 's' : ''} in ${channel}.\n\n` +
          `**Type:** ${getPurgeTypeLabel(type)}\n` +
          `**Requested:** ${amount} messages\n` +
          `**Deleted:** ${result} messages\n\n` +
          (result < amount
            ? '⚠️ Some messages may have been older than 14 days or not deletable.'
            : '')
      )
      .setFooter({ text: 'Purge operation completed' })
  } else {
    // Error
    const errorMessages: Record<string, string> = {
      MEMBER_PERM: `You don't have permission to manage messages in ${channel}.`,
      BOT_PERM: `I don't have permission to manage messages in ${channel}.`,
      INVALID_AMOUNT: 'Invalid amount specified.',
      NO_MESSAGES: 'No messages found matching the criteria.',
      ERROR: 'An error occurred while purging messages.',
    }

    resultEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle('❌ Purge Failed')
      .setDescription(errorMessages[result] || 'Unknown error occurred.')
      .setFooter({ text: 'Please try again or contact support' })
  }

  const backButton = createSecondaryBtn({
    customId: 'purge:btn:back',
    label: 'Back to Type Selection',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [backButton],
  })
}

/**
 * Handle purge cancellation
 */
export async function handlePurgeCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('❌ Purge Cancelled')
    .setDescription('The purge operation has been cancelled.')
    .setFooter({ text: 'No messages were deleted' })

  const backButton = createSecondaryBtn({
    customId: 'purge:btn:back',
    label: 'Back to Type Selection',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [backButton],
  })
}

/**
 * Get human-readable label for purge type
 */
function getPurgeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    all: 'All Messages',
    attachments: 'Messages with Attachments',
    bots: 'Bot Messages',
    links: 'Messages with Links',
    token: 'Messages with Token/Keyword',
    user: 'User Messages',
  }
  return labels[type] || type
}
