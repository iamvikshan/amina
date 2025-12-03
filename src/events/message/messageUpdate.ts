import type { Message, PartialMessage } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Handles message update events
 * @param {BotClient} client - The bot client instance
 * @param {Message | PartialMessage} oldMessage - The old message before update
 * @param {Message | PartialMessage} newMessage - The new message after update
 */
export default async (
  _client: BotClient,
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
): Promise<void> => {
  // Ignore if message is partial
  if (oldMessage.partial) return

  // Ignore bot messages
  if (oldMessage.author.bot) return

  // Ignore messages not in a guild
  if (!oldMessage.guild) return

  const settings = await getSettings(oldMessage.guild)
  if (!settings.logs.enabled || !settings.logs_channel) return

  const logChannel: any = oldMessage.guild.channels.cache.get(
    settings.logs_channel
  )
  if (!logChannel) return

  // Ignore if the content hasn't changed
  if (oldMessage.content === newMessage.content) return

  // Check if message edit logging is enabled
  if (!settings.logs.member.message_edit) return

  const embed = MinaEmbed.primary()
    .setTitle('message edited')
    .setDescription(`a message was edited in ${oldMessage.channel.toString()}`)
    .addFields(
      {
        name: 'author',
        value: `${oldMessage.author.tag} (${oldMessage.author.id})`,
        inline: true,
      },
      { name: 'channel', value: oldMessage.channel.toString(), inline: true },
      {
        name: 'old content',
        value:
          oldMessage.content && oldMessage.content.length > 1024
            ? oldMessage.content.slice(0, 1021) + '...'
            : oldMessage.content || 'none',
      },
      {
        name: 'new content',
        value:
          newMessage.content && newMessage.content.length > 1024
            ? newMessage.content.slice(0, 1021) + '...'
            : newMessage.content || 'none',
      }
    )
    .setTimestamp()

  logChannel.safeSend({ embeds: [embed] })
}
