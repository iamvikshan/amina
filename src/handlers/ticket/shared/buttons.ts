import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonInteraction,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS, TICKET } from '@src/config'

// schemas
import { getSettings } from '@schemas/Guild'

// helpers
import { error } from '@helpers/Logger'

// shared utilities
import {
  getTicketChannels,
  getExistingTicketChannel,
  closeTicket,
} from './utils'

const OPEN_PERMS = ['ManageChannels'] as const

/**
 * Handle ticket open button interaction
 */
export async function handleTicketOpen(
  interaction: ButtonInteraction
): Promise<any> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
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
    const settingsData = await getSettings(interaction.guild!)
    const staffRoles = (settingsData as any).server.staff_roles || []

    // Check bot permissions before proceeding
    if (
      !guild.members.me?.permissions.has([
        'ManageChannels',
        'ViewChannel',
      ] as any)
    ) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(
              "❌ I don't have the required permissions to create ticket channels!\n\n" +
                'Please ensure I have:\n' +
                '• **Manage Channels**\n' +
                '• **View Channel**\n\n' +
                'Also make sure my role is positioned above the ticket category.'
            ),
        ],
      })
    }

    // Build category permission overwrites (bot, admin who ran command, staff roles)
    const categoryPerms: any[] = [
      {
        id: guild.roles.everyone,
        deny: ['ViewChannel'],
      },
      {
        id: guild.members.me!,
        allow: [
          'ViewChannel',
          'SendMessages',
          'ReadMessageHistory',
          'ManageChannels',
        ],
      },
      {
        id: user.id,
        allow: [
          'ViewChannel',
          'SendMessages',
          'ReadMessageHistory',
          'ManageChannels',
        ],
      },
    ]

    // Add staff roles to category
    if (staffRoles.length > 0) {
      staffRoles.forEach((roleId: string) => {
        const role = guild.roles.cache.get(roleId)
        if (role) {
          categoryPerms.push({
            id: role,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
          })
        }
      })
    }

    // Get or create category for topic, or use default
    let parent: any
    if (catName) {
      // Find topic category by name
      const topicCategory = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name === catName
      )
      if (topicCategory) {
        parent = topicCategory
      } else {
        // Create topic category
        parent = await guild.channels.create({
          name: catName,
          type: ChannelType.GuildCategory,
          permissionOverwrites: categoryPerms,
        })
      }
    } else {
      // Use default tickets category
      const categoryId = (settingsData as any).ticket.category
      if (categoryId) {
        parent = guild.channels.cache.get(categoryId)
      }

      if (!parent) {
        // Create default "Tickets" category
        parent = await guild.channels.create({
          name: 'Tickets',
          type: ChannelType.GuildCategory,
          permissionOverwrites: categoryPerms,
        })
        ;(settingsData as any).ticket.category = parent.id
        ;(settingsData as any).ticket.enabled = true
        await settingsData.save()
      }
    }

    // Create ticket channel - inherit category perms first, then add user
    // Don't set explicit perms, let it inherit from category, then add user override
    const tktChannel = await guild.channels.create({
      name: `tіcket-${ticketNumber}`,
      parent: parent.id,
      type: ChannelType.GuildText,
      topic: `tіcket|${user.id}|${catName || 'Default'}`,
      // Don't set permissionOverwrites here - let it inherit from category
    })

    // Now add the user's permissions (this will be in addition to category perms)
    try {
      await tktChannel.permissionOverwrites.create(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })
    } catch (permError) {
      // If we can't add user perms, try to delete the channel and report error
      try {
        await tktChannel.delete()
      } catch {
        // Ignore deletion error
      }
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(
              '❌ Failed to create ticket channel due to permission issues.\n\n' +
                'Please check that I have the **Manage Channels** permission and that my role is above the ticket category.'
            ),
        ],
      })
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Ticket #${ticketNumber}` })
      .setDescription(
        `Hello ${user.toString()}\n` +
          `Support will be with you shortly\n` +
          `${catName ? `\n**Topic:** ${catName}` : ''}`
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

    // DM user with ticket link (safe fallback)
    const dmEmbed = new EmbedBuilder()
      .setColor(TICKET.CREATE_EMBED as any)
      .setAuthor({ name: 'Ticket Created' })
      .setThumbnail(guild.iconURL())
      .setDescription(
        `**Server:** ${guild.name}\n` +
          `${catName ? `**Topic:** ${catName}\n` : ''}\n` +
          `Your ticket has been created! Click the button below to view it.`
      )

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('View Ticket')
        .setURL(sent.url)
        .setStyle(ButtonStyle.Link)
    )

    // Try to DM, but don't fail if it doesn't work
    try {
      await user.send({ embeds: [dmEmbed], components: [row] })
    } catch (dmError) {
      // User has DMs disabled or blocked bot - that's okay, continue
    }

    // Reply with success message and link to ticket
    const successEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        `Ticket created! 🔥\n\nClick the button below to view your ticket.`
      )

    const viewTicketButton =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View Ticket')
          .setURL(sent.url)
          .setStyle(ButtonStyle.Link)
      )

    await interaction.editReply({
      embeds: [successEmbed],
      components: [viewTicketButton],
    })
  } catch (ex: any) {
    error('handleTicketOpen', ex)

    // Provide more specific error messages
    let errorMessage = 'Failed to create ticket channel, an error occurred!'
    if (
      ex.message?.includes('Missing Permissions') ||
      ex.message?.includes('Missing Access')
    ) {
      errorMessage =
        "❌ I don't have the required permissions to create ticket channels!\n\n" +
        'Please ensure:\n' +
        '• I have **Manage Channels** permission\n' +
        '• My role is positioned above the ticket category\n' +
        '• The ticket category has proper permissions set'
    } else if (ex.message?.includes('Maximum number of channels')) {
      errorMessage =
        '❌ This server has reached the maximum number of channels!'
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(errorMessage),
      ],
    })
  }
}

/**
 * Handle ticket close button interaction
 */
export async function handleTicketClose(
  interaction: ButtonInteraction
): Promise<any> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const status = await closeTicket(interaction.channel as any, interaction.user)
  if (status === 'MISSING_PERMISSIONS') {
    await interaction.followUp({
      content:
        'Cannot close the ticket, missing permissions. Contact server manager for help!',
      flags: MessageFlags.Ephemeral,
    })
    return
  } else if (status === 'ERROR') {
    await interaction.followUp({
      content: 'Failed to close the ticket, an error occurred!',
      flags: MessageFlags.Ephemeral,
    })
    return
  } else if (status === 'SUCCESS') {
    // Ticket closed successfully - the closeTicket function already sent the embed
    // Just acknowledge the interaction
    await interaction.followUp({
      content: '✅ Ticket closed successfully!',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
}

/**
 * Handle ticket delete button interaction
 */
export async function handleTicketDelete(
  interaction: ButtonInteraction
): Promise<void> {
  // Extract channel ID from custom_id
  // Format: ticket:btn:delete|ch:${channelId}
  const parts = interaction.customId.split('|')
  const channelPart = parts[1] // Should be "ch:${channel.id}"
  const channelId = channelPart?.split(':')[1]

  if (!channelId) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '❌ Invalid channel data',
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content: '❌ Invalid channel data',
        flags: MessageFlags.Ephemeral,
      })
    }
    return
  }

  // Try to get channel - might be in cache or need to fetch
  let channel = interaction.guild!.channels.cache.get(channelId)

  if (!channel) {
    // Try to fetch the channel
    try {
      channel = await interaction.guild!.channels.fetch(channelId)
    } catch (fetchError) {
      // Channel doesn't exist or we can't access it
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: '❌ Channel not found or already deleted',
          flags: MessageFlags.Ephemeral,
        })
      } else {
        await interaction.reply({
          content: '❌ Channel not found or already deleted',
          flags: MessageFlags.Ephemeral,
        })
      }
      return
    }
  }

  if (!channel || channel.type !== ChannelType.GuildText) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '❌ Cannot delete this channel',
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content: '❌ Cannot delete this channel',
        flags: MessageFlags.Ephemeral,
      })
    }
    return
  }

  const textChannel = channel as any
  if (!textChannel.deletable) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '❌ Cannot delete this channel (missing permissions)',
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content: '❌ Cannot delete this channel (missing permissions)',
        flags: MessageFlags.Ephemeral,
      })
    }
    return
  }

  // Defer if not already deferred/replied
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  }

  try {
    await textChannel.delete()
    await interaction.followUp({
      content: '✅ Channel deleted successfully',
      flags: MessageFlags.Ephemeral,
    })
  } catch (error: any) {
    await interaction.followUp({
      content: `❌ Failed to delete channel: ${error.message || 'Unknown error'}`,
      flags: MessageFlags.Ephemeral,
    })
  }
}
