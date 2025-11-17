import {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createDangerBtn, createSecondaryBtn } from '@helpers/componentHelper'
import type { PurgeType } from './parameters/amount-select'

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
    all: 'All Messages',
    attachments: 'Messages with Attachments',
    bots: 'Bot Messages',
    links: 'Messages with Links',
    token: 'Messages with Token/Keyword',
    user: 'User Messages',
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setTitle('⚠️ Purge Preview')
    .setDescription(
      '**Review the purge operation before confirming:**\n\n' +
        `**Type:** ${typeLabels[purgeType]}\n` +
        `**Amount:** ${amount} messages\n` +
        `**Channel:** ${channelMention}\n` +
        (additionalData?.token
          ? `**Token/Keyword:** \`${additionalData.token}\` (case-insensitive)\n`
          : '') +
        (additionalData?.userId
          ? `**User:** <@${additionalData.userId}>\n`
          : '') +
        '\n⚠️ **Warning:** This action cannot be undone!\n' +
        '📝 Messages older than 14 days cannot be bulk deleted.\n' +
        '🔒 You must have Manage Messages permission in the target channel.'
    )
    .setFooter({
      text: 'Click Confirm to proceed or Cancel to abort',
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

  const confirmButton = createDangerBtn({
    customId: confirmCustomId,
    label: `Confirm Delete (${amount} messages)`,
    emoji: '⚠️',
  })

  const cancelButton = createSecondaryBtn({
    customId: 'purge:btn:cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  // Combine buttons in one row
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    confirmButton.components[0],
    cancelButton.components[0]
  )

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}
