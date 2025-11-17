import { Collection, GuildMember, BaseGuildTextChannel } from 'discord.js'
import { containsLink } from '@helpers/Utils'
import { error } from '@helpers/Logger'
import { logModeration } from './core'

/**
 * Delete the specified number of messages matching the type
 */
export async function purgeMessages(
  issuer: GuildMember,
  channel: BaseGuildTextChannel,
  type: 'ATTACHMENT' | 'BOT' | 'LINK' | 'TOKEN' | 'USER' | 'ALL',
  amount: number,
  argument?: any
): Promise<string | number> {
  if (
    !channel
      .permissionsFor(issuer)
      ?.has(['ManageMessages', 'ReadMessageHistory'])
  ) {
    return 'MEMBER_PERM'
  }

  if (
    !channel
      .permissionsFor(issuer.guild.members.me as GuildMember)
      ?.has(['ManageMessages', 'ReadMessageHistory'])
  ) {
    return 'BOT_PERM'
  }

  if (amount <= 0 || amount > 500) {
    return 'INVALID_AMOUNT'
  }

  const toDelete = new Collection()

  try {
    let messages: any
    switch (type) {
      case 'ALL':
        messages = await channel.messages.fetch({
          limit: amount,
          cache: false,
        })
        break
      case 'BOT': {
        messages = await channel.messages.fetch({ cache: false })
        messages = messages
          .filter((message: any) => message.author.bot)
          .first(amount)
        break
      }
      case 'LINK': {
        messages = await channel.messages.fetch({ cache: false })
        messages = messages
          .filter((message: any) => containsLink(message.content))
          .first(amount)
        break
      }
      case 'TOKEN': {
        const tokenLower = argument?.toLowerCase() || ''
        messages = await channel.messages.fetch({ cache: false })
        messages = messages
          .filter((message: any) =>
            message.content.toLowerCase().includes(tokenLower)
          )
          .first(amount)
        break
      }
      case 'ATTACHMENT': {
        messages = await channel.messages.fetch({ cache: false })
        messages = messages
          .filter((message: any) => message.attachments.size > 0)
          .first(amount)
        break
      }
      case 'USER': {
        messages = await channel.messages.fetch({ cache: false })
        messages = messages
          .filter((message: any) => message.author.id === argument)
          .first(amount)
        break
      }
    }

    for (const message of messages.values()) {
      if (toDelete.size >= amount) break
      if (!message.deletable) continue
      if (message.createdTimestamp < Date.now() - 1209600000) continue // skip messages older than 14 days

      if (type === 'ALL') {
        toDelete.set(message.id, message)
      } else if (type === 'ATTACHMENT') {
        if (message.attachments.size > 0) {
          toDelete.set(message.id, message)
        }
      } else if (type === 'BOT') {
        if (message.author.bot) {
          toDelete.set(message.id, message)
        }
      } else if (type === 'LINK') {
        if (containsLink(message.content)) {
          toDelete.set(message.id, message)
        }
      } else if (type === 'TOKEN') {
        const tokenLower = argument?.toLowerCase() || ''
        if (message.content.toLowerCase().includes(tokenLower)) {
          toDelete.set(message.id, message)
        }
      } else if (type === 'USER') {
        if (message.author.id === argument) {
          toDelete.set(message.id, message)
        }
      }
    }

    if (toDelete.size === 0) return 'NO_MESSAGES'
    if (
      toDelete.size === 1 &&
      (toDelete.first() as any).author.id === issuer.id
    ) {
      await (toDelete.first() as any).delete()
      return 'NO_MESSAGES'
    }

    const deletedMessages: any = await channel.bulkDelete(toDelete as any, true)
    await logModeration(issuer, '', '', 'Purge', {
      purgeType: type,
      channel: channel,
      deletedCount: deletedMessages.size,
    })

    return deletedMessages.size
  } catch (ex) {
    error('purgeMessages', ex)
    return 'ERROR'
  }
}
