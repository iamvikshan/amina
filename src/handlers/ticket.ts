import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonInteraction,
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

const OPEN_PERMS = ['ManageChannels'] as const
const CLOSE_PERMS = ['ManageChannels', 'ReadMessageHistory'] as const

/**
 * Check if channel is a ticket channel
 */
function isTicketChannel(channel: Channel): boolean {
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
function getTicketChannels(guild: Guild): Collection<string, any> {
  return guild.channels.cache.filter(ch => isTicketChannel(ch))
}

/**
 * Get existing ticket channel for a user
 */
function getExistingTicketChannel(guild: Guild, userId: string): any {
  const tktChannels = getTicketChannels(guild)
  return tktChannels.filter(ch => ch.topic.split('|')[1] === userId).first()
}

/**
 * Parse ticket details from channel topic
 */
async function parseTicketDetails(
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
async function closeTicket(
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
    const messages = await channel.messages.fetch()
    const reversed = Array.from(messages.values()).reverse()

    let content = ''
    reversed.forEach(m => {
      content += `[${new Date(m.createdAt).toLocaleString('en-US')}] - ${m.author.username}\n`
      if (m.cleanContent !== '') content += `${m.cleanContent}\n`
      if (m.attachments.size > 0)
        content += `${m.attachments.map(att => att.proxyURL).join(', ')}\n`
      content += '\n'
    })

    const logsUrl = await postToBin(content, `Ticket Logs for ${channel.name}`)
    const ticketDetails = await parseTicketDetails(channel)

    const components: ActionRowBuilder<ButtonBuilder>[] = []
    if (logsUrl) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Transcript')
            .setURL(logsUrl.short)
            .setStyle(ButtonStyle.Link)
        )
      )
    }

    if (channel.deletable) await channel.delete()

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Ticket Closed' })
      .setColor(TICKET.CLOSE_EMBED as any)
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

    // send embed to log channel
    if ((config as any).ticket.log_channel) {
      const logChannel = channel.guild.channels.cache.get(
        (config as any).ticket.log_channel
      )
      ;(logChannel as any)?.safeSend({ embeds: [embed], components })
    }

    // send embed to user
    if (ticketDetails?.user) {
      const dmEmbed = embed
        .setDescription(
          `**Server:** ${channel.guild.name}\n**Topic:** ${ticketDetails.catName}`
        )
        .setThumbnail(channel.guild.iconURL())
      ticketDetails.user.send({ embeds: [dmEmbed], components }).catch(() => {})
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
async function closeAllTickets(
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

/**
 * Handle ticket open button interaction
 */
async function handleTicketOpen(interaction: ButtonInteraction): Promise<any> {
  await interaction.deferReply({ ephemeral: true })
  const { guild, user } = interaction

  if (!guild) return

  if (!guild.members.me?.permissions.has(OPEN_PERMS as any))
    return interaction.followUp(
      'Cannot create ticket channel, missing `Manage Channel` permission. Contact server manager for help!'
    )

  const alreadyExists = getExistingTicketChannel(guild, user.id)
  if (alreadyExists)
    return interaction.followUp(`You already have an open ticket`)

  const settings = await getSettings(guild)

  // limit check
  const existing = getTicketChannels(guild).size
  if (existing > (settings as any).ticket.limit)
    return interaction.followUp(
      'There are too many open tickets. Try again later'
    )

  // check topics
  let catName: string | null = null
  let catPerms: string[] = []
  const topics = (settings as any).ticket.topics
  if (topics.length > 0) {
    const options: Array<{ label: string; value: string }> = []
    ;(settings as any).ticket.topics.forEach((cat: any) =>
      options.push({ label: cat.name, value: cat.name })
    )
    const menuRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket-menu')
          .setPlaceholder('topic category')
          .addOptions(options)
      )

    await interaction.followUp({
      content: 'Please choose a topic for the ticket',
      components: [menuRow],
    })
    const res = await interaction.channel
      ?.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        time: 60 * 1000,
      })
      .catch(err => {
        if (err.message.includes('time')) return
      })

    if (!res)
      return interaction.editReply({
        content: 'Timed out. Try again',
        components: [],
      })
    await interaction.editReply({ content: 'Processing', components: [] })
    catName = res.values[0]
    catPerms = (settings as any).server.staff_roles || []
  }

  try {
    const ticketNumber = (existing + 1).toString()
    const permissionOverwrites: any[] = [
      {
        id: guild.roles.everyone,
        deny: ['ViewChannel'],
      },
      {
        id: user.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
      {
        id: guild.members.me?.roles.highest.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
    ]

    if (catPerms?.length > 0) {
      catPerms?.forEach(roleId => {
        const role = guild.roles.cache.get(roleId)
        if (!role) return
        permissionOverwrites.push({
          id: role,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        })
      })
    }

    const settingsData = await getSettings(interaction.guild)
    const categoryId = (settingsData as any).ticket.category

    // get channel parent (use the set category or create a new "Tickets" category)
    let parent: any
    if (categoryId && interaction.guild) {
      parent = interaction.guild.channels.cache.get(categoryId)
    }

    if (!parent && interaction.guild) {
      parent = await interaction.guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: ['ViewChannel'],
          },
        ],
      })
      ;(settingsData as any).ticket.category = parent.id
      ;(settingsData as any).ticket.enabled = true
      await settingsData.save()
    }

    if (!interaction.guild) return

    const tktChannel = await interaction.guild.channels.create({
      name: `tіcket-${ticketNumber}`,
      parent: parent.id,
      type: ChannelType.GuildText,
      topic: `tіcket|${user.id}|${catName || 'Default'}`,
      permissionOverwrites,
    })

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Ticket #${ticketNumber}` })
      .setDescription(
        `Hello ${user.toString()}
        Support will be with you shortly
        ${catName ? `\n**Topic:** ${catName}` : ''}
        `
      )
      .setFooter({
        text: 'You may close your ticket anytime by clicking the button below',
      })

    const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Close Ticket')
        .setCustomId('TICKET_CLOSE')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Primary)
    )

    const sent = await tktChannel.send({
      content: user.toString(),
      embeds: [embed],
      components: [buttonsRow],
    })

    const dmEmbed = new EmbedBuilder()
      .setColor(TICKET.CREATE_EMBED as any)
      .setAuthor({ name: 'Ticket Created' })
      .setThumbnail(guild.iconURL())
      .setDescription(
        `**Server:** ${guild.name}
        ${catName ? `**Topic:** ${catName}` : ''}
        `
      )

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('View Channel')
        .setURL(sent.url)
        .setStyle(ButtonStyle.Link)
    )

    user.send({ embeds: [dmEmbed], components: [row] }).catch(() => {})

    await interaction.editReply(`Ticket created! 🔥`)
  } catch (ex) {
    error('handleTicketOpen', ex)
    return interaction.editReply(
      'Failed to create ticket channel, an error occurred!'
    )
  }
}

/**
 * Handle ticket close button interaction
 */
async function handleTicketClose(interaction: ButtonInteraction): Promise<any> {
  await interaction.deferReply({ ephemeral: true })
  const status = await closeTicket(
    interaction.channel as BaseGuildTextChannel,
    interaction.user
  )
  if (status === 'MISSING_PERMISSIONS') {
    return interaction.followUp(
      'Cannot close the ticket, missing permissions. Contact server manager for help!'
    )
  } else if (status === 'ERROR') {
    return interaction.followUp(
      'Failed to close the ticket, an error occurred!'
    )
  }
}

export default {
  getTicketChannels,
  getExistingTicketChannel,
  isTicketChannel,
  closeTicket,
  closeAllTickets,
  handleTicketOpen,
  handleTicketClose,
}
