import type { Message, PartialMessage } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Handles message deletion events
 * @param {BotClient} client - The bot client instance
 * @param {Message | PartialMessage} message - The deleted message
 */
export default async (
  _client: BotClient,
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
    const deleteEmbed = MinaEmbed.primary()
      .setTitle('message deleted')
      .setDescription(`a message was deleted in ${message.channel.toString()}`)
      .addFields(
        {
          name: 'author',
          value: message.author
            ? `${message.author.tag} (${message.author.id})`
            : 'unknown',
          inline: true,
        },
        { name: 'channel', value: message.channel.toString(), inline: true },
        {
          name: 'content',
          value: message.content || 'none (possibly an embed or attachment)',
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

    if (
      (members && members.size > 0) ||
      (roles && roles.size > 0) ||
      everyone
    ) {
      const ghostPingEmbed = MinaEmbed.primary()
        .setTitle('ghost ping detected')
        .setDescription(
          `**message:**\n${message.content}\n\n` +
            `**author:** ${message.author.tag} \`${message.author.id}\`\n` +
            `**channel:** ${message.channel.toString()}`
        )
        .addFields(
          {
            name: 'members',
            value: (members?.size ?? 0).toString(),
            inline: true,
          },
          { name: 'roles', value: (roles?.size ?? 0).toString(), inline: true },
          { name: 'everyone?', value: everyone ? 'yes' : 'no', inline: true }
        )
        .setFooter({ text: `sent at: ${message.createdAt}` })

      logChannel.safeSend({ embeds: [ghostPingEmbed] })
    }
  }
}
