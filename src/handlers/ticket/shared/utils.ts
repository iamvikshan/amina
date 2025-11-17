import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  BaseGuildTextChannel,
  Guild,
  User,
  Channel,
  Collection,
} from 'discord.js'
import { TICKET } from '@src/config'

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
        const dmEmbed = new EmbedBuilder()
          .setColor(TICKET.CLOSE_EMBED as any)
          .setAuthor({ name: 'Ticket Closed' })
          .setDescription(
            `Your ticket **${channel.name}** has been closed.\n\n` +
              `**Server:** ${channel.guild.name}\n` +
              `**Topic:** ${ticketDetails.catName}\n\n` +
              `Click the button below to view the transcript.`
          )
          .setThumbnail(channel.guild.iconURL())

        const transcriptButton =
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('View Transcript')
              .setURL(logsUrl.short)
              .setStyle(ButtonStyle.Link)
          )

        await ticketDetails.user.send({
          embeds: [dmEmbed],
          components: [transcriptButton],
        })
      } catch (dmError) {
        // User has DMs disabled - that's okay, continue
      }
    }

    // Sync channel permissions with category (removes non-admins)
    // This effectively removes all users except those with category-level permissions
    if (channel.parent) {
      try {
        await channel.lockPermissions()
      } catch (permError) {
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
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Ticket Closed' })
      .setColor(TICKET.CLOSE_EMBED as any)

    let description =
      'This ticket has been closed. All non-admin users have been removed.\n\n'
    if (logsUrl) {
      description +=
        'A transcript has been generated and sent to the ticket creator.\n\n'
    }
    description += 'Click the button below to permanently delete this channel.'
    embed.setDescription(description)
    const fields: Array<{ name: string; value: string; inline: boolean }> = []

    if (reason) fields.push({ name: 'Reason', value: reason, inline: false })
    fields.push(
      {
        name: 'Opened By',
        value: ticketDetails?.user ? ticketDetails.user.username : 'Unknown',
        inline: true,
      },
      {
        name: 'Closed By',
        value: closedBy ? closedBy.username : 'Unknown',
        inline: true,
      }
    )

    embed.setFields(fields)

    const components: ActionRowBuilder<ButtonBuilder>[] = []

    // Add delete button
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket:btn:delete|ch:${channel.id}`)
          .setLabel('Delete Channel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️')
      )
    )

    // Add transcript link if available
    if (logsUrl) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('View Transcript')
            .setURL(logsUrl.short)
            .setStyle(ButtonStyle.Link)
        )
      )
    }

    // Send final embed to channel
    try {
      await channel.send({ embeds: [embed], components })
    } catch (sendError) {
      // Channel might be deleted or inaccessible - that's okay
    }

    // Send embed to log channel
    if ((config as any).ticket.log_channel) {
      const logChannel = channel.guild.channels.cache.get(
        (config as any).ticket.log_channel
      )
      const logEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Ticket Closed' })
        .setColor(TICKET.CLOSE_EMBED as any)
        .setFields(fields)

      const logComponents: ActionRowBuilder<ButtonBuilder>[] = []
      if (logsUrl) {
        logComponents.push(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('Transcript')
              .setURL(logsUrl.short)
              .setStyle(ButtonStyle.Link)
          )
        )
      }
      ;(logChannel as any)?.safeSend({
        embeds: [logEmbed],
        components: logComponents,
      })
    }

    // Send embed to user (no logging needed as per user request)
    if (ticketDetails?.user) {
      const dmEmbed = new EmbedBuilder()
        .setColor(TICKET.CLOSE_EMBED as any)
        .setAuthor({ name: 'Ticket Closed' })
        .setDescription(
          `**Server:** ${channel.guild.name}\n` +
            `**Topic:** ${ticketDetails.catName}\n\n` +
            `Your ticket has been closed.`
        )
        .setThumbnail(channel.guild.iconURL())
        .setFields(fields.filter(f => f.name !== 'Reason')) // Don't show reason to user

      const dmComponents: ActionRowBuilder<ButtonBuilder>[] = []
      if (logsUrl) {
        dmComponents.push(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('View Transcript')
              .setURL(logsUrl.short)
              .setStyle(ButtonStyle.Link)
          )
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
