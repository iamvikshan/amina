import { ButtonInteraction, TextChannel, GuildMember } from 'discord.js'
import { purgeMessages } from '@helpers/ModUtils/purge'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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
      content: 'invalid purge state, please try again.',
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
    ;(interaction.client as any).logger.error(
      'Failed to decode purge state:',
      error
    )
    await interaction.editReply({
      content:
        'invalid purge state, the operation may have expired. try again.',
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
      content: 'invalid channel, it may have been deleted.',
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
      content: `you don't have permission to manage messages in ${channel}.`,
      embeds: [],
      components: [],
    })
    return
  }

  const botMember = interaction.guild?.members.me
  if (
    !botMember ||
    !channel
      .permissionsFor(botMember)
      ?.has(['ManageMessages', 'ReadMessageHistory'])
  ) {
    await interaction.editReply({
      content: `i don't have permission to manage messages in ${channel}.`,
      embeds: [],
      components: [],
    })
    return
  }

  // Show loading embed
  const loadingEmbed = MinaEmbed.primary().setDescription(
    'purging messages... this may take a moment.'
  )

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
  let resultEmbed: MinaEmbed

  if (typeof result === 'number') {
    // Success
    resultEmbed = MinaEmbed.success()
      .setTitle('purge complete')
      .setDescription(
        `deleted **${result}** message${result !== 1 ? 's' : ''} in ${channel}.\n\n` +
          `**type:** ${getPurgeTypeLabel(type)}\n` +
          `**requested:** ${amount} messages\n` +
          `**deleted:** ${result} messages\n\n` +
          (result < amount
            ? 'some messages may have been older than 14 days or not deletable.'
            : '')
      )
      .setFooter({ text: 'purge operation completed' })
  } else {
    // Error
    const errorMessages: Record<string, string> = {
      MEMBER_PERM: `you don't have permission to manage messages in ${channel}.`,
      BOT_PERM: `i don't have permission to manage messages in ${channel}.`,
      INVALID_AMOUNT: 'invalid amount specified.',
      NO_MESSAGES: 'no messages found matching the criteria.',
      ERROR: 'an error occurred while purging messages.',
    }

    resultEmbed = MinaEmbed.error()
      .setTitle('purge failed')
      .setDescription(errorMessages[result] || 'unknown error occurred.')
      .setFooter({ text: 'please try again or contact support' })
  }

  const backRow = MinaRows.backRow('purge:btn:back')

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [backRow],
  })
}

/**
 * Handle purge cancellation
 */
export async function handlePurgeCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = MinaEmbed.primary()
    .setTitle('purge cancelled')
    .setDescription('the purge operation has been cancelled.')
    .setFooter({ text: 'no messages were deleted' })

  const backRow = MinaRows.backRow('purge:btn:back')

  await interaction.editReply({
    embeds: [embed],
    components: [backRow],
  })
}

/**
 * Get human-readable label for purge type
 */
function getPurgeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    all: 'all messages',
    attachments: 'messages with attachments',
    bots: 'bot messages',
    links: 'messages with links',
    token: 'messages with token/keyword',
    user: 'user messages',
  }
  return labels[type] || type
}
