import {
  GuildChannel,
  ChannelType,
  type MessagePayload,
  type MessageCreateOptions,
} from 'discord.js'

/**
 * Check if bot has permission to send embeds
 */
GuildChannel.prototype.canSendEmbeds = function (this: GuildChannel): boolean {
  return this.permissionsFor(this.guild.members.me!).has([
    'ViewChannel',
    'SendMessages',
    'EmbedLinks',
  ])
}

/**
 * Safely send a message to the channel
 * @param content - The message content
 * @param seconds - Optional auto-delete timeout in seconds
 */
GuildChannel.prototype.safeSend = async function (
  this: GuildChannel,
  content: string | MessagePayload | MessageCreateOptions,
  seconds?: number
): Promise<any> {
  if (!content) return
  if (this.type !== ChannelType.GuildText && (this as any).type !== 0) return

  const perms: any[] = ['ViewChannel', 'SendMessages']
  if ((content as any).embeds && (content as any).embeds.length > 0)
    perms.push('EmbedLinks')
  if (!this.permissionsFor(this.guild.members.me!).has(perms)) return

  try {
    if (!seconds) return await (this as any).send(content)
    const reply = await (this as any).send(content)
    setTimeout(
      () => reply.deletable && reply.delete().catch((_ex: any) => {}),
      seconds * 1000
    )
  } catch (ex) {
    ;(this.client as any).logger.error(`safeSend`, ex)
    // ex is used in logger.error
  }
}
