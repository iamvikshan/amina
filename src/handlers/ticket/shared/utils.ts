import {
  ChannelType,
  BaseGuildTextChannel,
  Guild,
  User,
  Collection,
  ActionRowBuilder,
} from 'discord.js'
import type { Channel, ButtonBuilder } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

// schemas
import { getSettings } from '@schemas/Guild'

// helpers
import { postToBin } from '@helpers/HttpUtils'
import { error } from '@helpers/Logger'

const CLOSE_PERMS = ['ManageChannels', 'ReadMessageHistory'] as const

/**
 * Check if channel is a ticket channel
 */
export function isTicketChannel(channel: Channel): boolean {
  return (
    channel.type === ChannelType.GuildText &&
    (channel as any).name.startsWith('tіcket-') &&
    (channel as any).topic &&
    (channel as any).topic.startsWith('tіcket|')
  )
}

/**
 * Get all ticket channels in a guild
 */
export function getTicketChannels(guild: Guild): Collection<string, any> {
  return guild.channels.cache.filter(ch => isTicketChannel(ch))
}

/**
 * Get existing ticket channel for a user
 */
export function getExistingTicketChannel(guild: Guild, userId: string): any {
  const tktChannels = getTicketChannels(guild)
  return tktChannels.filter(ch => ch.topic.split('|')[1] === userId).first()
}

/**
 * Parse ticket details from channel topic
 */
export async function parseTicketDetails(
  channel: BaseGuildTextChannel
): Promise<{ user?: User; catName: string } | undefined> {
  if (!channel.topic) return
  const split = channel.topic?.split('|')
  const userId = split[1]
  const catName = split[2] || 'Default'
  const user = await channel.client.users
    .fetch(userId, { cache: false })
    .catch(() => undefined)
  return { user, catName }
}

/**
 * Close a ticket channel
 */
export async function closeTicket(
  channel: BaseGuildTextChannel,
  closedBy: User,
  reason?: string
): Promise<string> {
  if (
    !channel.deletable ||
    !channel
      .permissionsFor(channel.guild.members.me as any)
      ?.has(CLOSE_PERMS as any)
  ) {
    return 'MISSING_PERMISSIONS'
  }

  try {
    const config = await getSettings(channel.guild)
    const ticketDetails = await parseTicketDetails(channel)

    // Fetch messages and create transcript BEFORE removing users
    const messages = await channel.messages.fetch()
    const reversed = Array.from(messages.values()).reverse()

    let content = ''
    if (messages.size > 0) {
      reversed.forEach(m => {
        content += `[${new Date(m.createdAt).toLocaleString('en-US')}] - ${m.author.username}\n`
        if (m.cleanContent !== '') content += `${m.cleanContent}\n`
        if (m.attachments.size > 0)
          content += `${m.attachments.map(att => att.proxyURL).join(', ')}\n`
        content += '\n'
      })
    } else {
      content = `No messages in ticket ${channel.name}`
    }

    // Only post to bin if there's content
    let logsUrl: { url: string; short: string; raw: string } | undefined
    if (content.trim().length > 0) {
      logsUrl = await postToBin(content, `Ticket Logs for ${channel.name}`)
    }

    // DM user with transcript if available
    if (ticketDetails?.user && logsUrl) {
      try {
        const dmEmbed = MinaEmbed.primary()
          .setAuthor({ name: mina.say('ticket.closeEmbed.title') })
          .setDescription(
            mina.sayf('ticket.closeEmbed.description', {
              channel: channel.name,
              server: channel.guild.name,
              topic: ticketDetails.catName,
            })
          )
          .setThumbnail(channel.guild.iconURL())

        const transcriptButton = MinaRows.from(
          MinaButtons.link(logsUrl.short, mina.say('ticket.closeEmbed.button'))
        )

        await ticketDetails.user.send({
          embeds: [dmEmbed],
          components: [transcriptButton],
        })
      } catch (_dmError) {
        // User has DMs disabled - that's okay, continue
      }
    }

    // Sync channel permissions with category (removes non-admins)
    // This effectively removes all users except those with category-level permissions
    if (channel.parent) {
      try {
        await channel.lockPermissions()
      } catch (_permError) {
        // If lock fails, manually remove user permissions
        const overwrites = channel.permissionOverwrites.cache
        for (const overwrite of overwrites.values()) {
          if (overwrite.type === 1) {
            // User overwrite
            try {
              await overwrite.delete()
            } catch {
              // Ignore individual permission removal errors
            }
          }
        }
      }
    } else {
      // No parent category, manually remove all user permissions
      const overwrites = channel.permissionOverwrites.cache
      for (const overwrite of overwrites.values()) {
        if (overwrite.type === 1) {
          // User overwrite
          try {
            await overwrite.delete()
          } catch {
            // Ignore individual permission removal errors
          }
        }
      }
    }

    // Create close embed with delete button
    let description =
      'this ticket has been closed. all non-admin users have been removed.\n\n'
    if (logsUrl) {
      description +=
        'a transcript has been generated and sent to the ticket creator.\n\n'
    }
    description += 'click the button below to permanently delete this channel.'

    const embed = MinaEmbed.primary()
      .setAuthor({ name: mina.say('ticket.closeEmbed.title') })
      .setDescription(description)

    const fields: Array<{ name: string; value: string; inline: boolean }> = []

    if (reason) fields.push({ name: 'reason', value: reason, inline: false })
    fields.push(
      {
        name: 'opened by',
        value: ticketDetails?.user ? ticketDetails.user.username : 'unknown',
        inline: true,
      },
      {
        name: 'closed by',
        value: closedBy ? closedBy.username : 'unknown',
        inline: true,
      }
    )

    embed.setFields(fields)

    const components: any[] = []

    // Add delete button
    components.push(
      MinaRows.from(
        MinaButtons.delete(`ticket:btn:delete|ch:${channel.id}`).setLabel(
          'delete channel'
        )
      )
    )

    // Add transcript link if available
    if (logsUrl) {
      components.push(
        MinaRows.from(
          MinaButtons.link(logsUrl.short, mina.say('ticket.closeEmbed.button'))
        )
      )
    }

    // Send final embed to channel
    try {
      await channel.send({ embeds: [embed], components })
    } catch (_sendError) {
      // Channel might be deleted or inaccessible - that's okay
    }

    // Send embed to log channel
    if ((config as any).ticket.log_channel) {
      const logChannel = channel.guild.channels.cache.get(
        (config as any).ticket.log_channel
      )
      const logEmbed = MinaEmbed.plain()
        .setColor(mina.color.muted as any)
        .setAuthor({ name: 'ticket closed' })
        .setFields(fields)

      const logComponents: any[] = []
      if (logsUrl) {
        logComponents.push(
          MinaRows.from(MinaButtons.link(logsUrl.short, 'transcript'))
        )
      }
      ;(logChannel as any)?.safeSend({
        embeds: [logEmbed],
        components: logComponents,
      })
    }

    // Send embed to user (no logging needed as per user request)
    if (ticketDetails?.user) {
      const dmEmbed = MinaEmbed.primary()
        .setAuthor({ name: mina.say('ticket.closeEmbed.title') })
        .setDescription(
          mina
            .sayf('ticket.closeEmbed.description', {
              channel: channel.name,
              server: channel.guild.name,
              topic: ticketDetails.catName,
            })
            .replace(
              'click the button below to view the transcript.',
              'your ticket has been closed.'
            )
        )
        .setThumbnail(channel.guild.iconURL())
        .setFields(fields.filter(f => f.name !== 'Reason')) // Don't show reason to user

      const dmComponents: ActionRowBuilder<ButtonBuilder>[] = []
      if (logsUrl) {
        dmComponents.push(
          MinaRows.single(MinaButtons.link(logsUrl.short, 'view transcript'))
        )
      }
      ticketDetails.user
        .send({ embeds: [dmEmbed], components: dmComponents })
        .catch(() => {})
    }

    return 'SUCCESS'
  } catch (ex) {
    error('closeTicket', ex)
    return 'ERROR'
  }
}

/**
 * Close all open tickets in a guild
 */
export async function closeAllTickets(
  guild: Guild,
  author: User
): Promise<[number, number]> {
  const channels = getTicketChannels(guild)
  let success = 0
  let failed = 0

  for (const ch of channels) {
    const status = await closeTicket(
      ch[1],
      author,
      'Force close all open tickets'
    )
    if (status === 'SUCCESS') success += 1
    else failed += 1
  }

  return [success, failed]
}
