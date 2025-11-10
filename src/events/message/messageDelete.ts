import { EmbedBuilder, Message, PartialMessage } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { EMBED_COLORS } from '@src/config'
import type { BotClient } from '@src/structures'

/**
 * Handles message deletion events
 * @param {BotClient} client - The bot client instance
 * @param {Message | PartialMessage} message - The deleted message
 */
export default async (
  client: BotClient,
  message: Message | PartialMessage
): Promise<void> => {
  if (message.partial) return
  if (!message.guild) return

  const settings = await getSettings(message.guild)
  if (!settings.logs.enabled || !settings.logs_channel) return

  const logChannel: any = message.guild.channels.cache.get(
    settings.logs_channel
  )
  if (!logChannel) return

  // Log message deletions only if message_delete is true
  if (settings.logs.member.message_delete) {
    const deleteEmbed = new EmbedBuilder()
      .setTitle('Message Deleted')
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setDescription(`A message was deleted in ${message.channel.toString()}`)
      .addFields(
        {
          name: 'Author',
          value: message.author
            ? `${message.author.tag} (${message.author.id})`
            : 'Unknown',
          inline: true,
        },
        { name: 'Channel', value: message.channel.toString(), inline: true },
        {
          name: 'Content',
          value: message.content || 'None (possibly an embed or attachment)',
        }
      )
      .setTimestamp()

    logChannel.safeSend({ embeds: [deleteEmbed] })
  }

  // Check for ghost pings if the setting is enabled
  if (
    settings.automod.anti_ghostping &&
    message.author &&
    !message.author.bot
  ) {
    const { members, roles, everyone } = message.mentions

    if (members.size > 0 || roles.size > 0 || everyone) {
      const ghostPingEmbed = new EmbedBuilder()
        .setTitle('Ghost Ping Detected')
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setDescription(
          `**Message:**\n${message.content}\n\n` +
            `**Author:** ${message.author.tag} \`${message.author.id}\`\n` +
            `**Channel:** ${message.channel.toString()}`
        )
        .addFields(
          { name: 'Members', value: members.size.toString(), inline: true },
          { name: 'Roles', value: roles.size.toString(), inline: true },
          { name: 'Everyone?', value: everyone ? 'Yes' : 'No', inline: true }
        )
        .setFooter({ text: `Sent at: ${message.createdAt}` })

      logChannel.safeSend({ embeds: [ghostPingEmbed] })
    }
  }
}
