import { EmbedBuilder, Message } from 'discord.js'
import type { PartialMessage } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { EMBED_COLORS } from '@src/config'
import type { BotClient } from '@src/structures'

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

  const embed = new EmbedBuilder()
    .setTitle('Message Edited')
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`A message was edited in ${oldMessage.channel.toString()}`)
    .addFields(
      {
        name: 'Author',
        value: `${oldMessage.author.tag} (${oldMessage.author.id})`,
        inline: true,
      },
      { name: 'Channel', value: oldMessage.channel.toString(), inline: true },
      {
        name: 'Old Content',
        value:
          oldMessage.content && oldMessage.content.length > 1024
            ? oldMessage.content.slice(0, 1021) + '...'
            : oldMessage.content || 'None',
      },
      {
        name: 'New Content',
        value:
          newMessage.content && newMessage.content.length > 1024
            ? newMessage.content.slice(0, 1021) + '...'
            : newMessage.content || 'None',
      }
    )
    .setTimestamp()

  logChannel.safeSend({ embeds: [embed] })
}
