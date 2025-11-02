import {
  Message,
  type MessagePayload,
  type MessageReplyOptions,
} from 'discord.js'

/**
 * Safely reply to a message
 * @param content - The reply content
 * @param seconds - Optional auto-delete timeout in seconds
 */
Message.prototype.safeReply = async function (
  this: Message,
  content: string | MessagePayload | MessageReplyOptions,
  seconds?: number
): Promise<any> {
  if (!content) return
  const perms: any[] = ['ViewChannel', 'SendMessages']
  if ((content as any).embeds && (content as any).embeds.length > 0)
    perms.push('EmbedLinks')
  if (
    this.channel.type !== 0 && // DM channel type is 0
    !(this.channel as any).permissionsFor(this.guild!.members.me!).has(perms)
  )
    return

  perms.push('ReadMessageHistory')
  if (
    this.channel.type !== 0 &&
    !(this.channel as any).permissionsFor(this.guild!.members.me!).has(perms)
  ) {
    return (this.channel as any).safeSend(content, seconds)
  }

  try {
    if (!seconds) return await this.reply(content)
    const reply = await this.reply(content)
    setTimeout(
      () => reply.deletable && reply.delete().catch((ex: any) => {}),
      seconds * 1000
    )
  } catch (ex) {
    ;(this.client as any).logger.error(`safeReply`, ex)
  }
}
