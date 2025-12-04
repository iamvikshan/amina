import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ButtonStyle,
} from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
// PurgeType is now globally available - see types/handlers.d.ts

/**
 * Show purge preview with confirmation
 */
export async function showPurgePreview(
  interaction: ButtonInteraction | ChannelSelectMenuInteraction,
  purgeType: PurgeType,
  amount: number,
  channelId: string,
  additionalData?: { token?: string; userId?: string }
): Promise<void> {
  const channel = interaction.guild?.channels.cache.get(channelId)
  const channelMention = channel ? `<#${channelId}>` : `Channel ${channelId}`

  const typeLabels: Record<PurgeType, string> = {
    all: 'all messages',
    attachments: 'messages with attachments',
    bots: 'bot messages',
    links: 'messages with links',
    token: 'messages with token/keyword',
    user: 'user messages',
  }

  const embed = MinaEmbed.warning()
    .setTitle('purge preview')
    .setDescription(
      '**review the purge operation before confirming:**\n\n' +
        `**type:** ${typeLabels[purgeType]}\n` +
        `**amount:** ${amount} messages\n` +
        `**channel:** ${channelMention}\n` +
        (additionalData?.token
          ? `**token/keyword:** \`${additionalData.token}\` (case-insensitive)\n`
          : '') +
        (additionalData?.userId
          ? `**user:** <@${additionalData.userId}>\n`
          : '') +
        '\n**warning:** this action cannot be undone!\n' +
        'messages older than 14 days cannot be bulk deleted.\n' +
        'you must have manage messages permission in the target channel.'
    )
    .setFooter({
      text: 'click confirm to proceed or cancel to abort',
    })

  // Encode state for confirm button (keep under 100 chars)
  const stateData = {
    type: purgeType,
    amount,
    channelId,
    token: additionalData?.token,
    userId: additionalData?.userId,
  }
  const stateEncoded = Buffer.from(JSON.stringify(stateData)).toString('base64')
  const confirmCustomId = `purge:btn:confirm|${stateEncoded}`.substring(0, 100)

  // Combine buttons in one row
  const buttonRow = MinaRows.from(
    MinaButtons.custom(
      confirmCustomId,
      `confirm (${amount})`,
      ButtonStyle.Danger
    ),
    MinaButtons.nah('purge:btn:cancel')
  )

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}
