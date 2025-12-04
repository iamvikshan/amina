import {
  ActionRowBuilder,
  ChannelType,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonInteraction,
  MessageFlags,
} from 'discord.js'
import type {
  PermissionResolvable,
  BaseGuildTextChannel,
  CategoryChannel,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

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

  if (!guild.members.me?.permissions.has(OPEN_PERMS as PermissionResolvable))
    return interaction.followUp(mina.say('error.noPermission'))

  const alreadyExists = getExistingTicketChannel(guild, user.id)
  if (alreadyExists)
    return interaction.followUp(mina.say('error.alreadyExists'))

  const settings = await getSettings(guild)

  // limit check
  const existing = getTicketChannels(guild).size
  if (existing > settings.ticket.limit)
    return interaction.followUp(mina.say('error.tooMany'))

  // check topics
  let catName: string | null = null
  const topics = settings.ticket.topics
  if (topics.length > 0) {
    const options: Array<{ label: string; value: string }> = []
    settings.ticket.topics.forEach(cat =>
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
      content: mina.say('error.chooseTopic'),
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
        content: mina.say('error.timedOut'),
        components: [],
      })
    await interaction.editReply({
      content: mina.say('error.processing'),
      components: [],
    })
    catName = res.values[0]
  }

  try {
    const ticketNumber = (existing + 1).toString()
    const staffRoles = settings.server?.staff_roles || []

    // Check bot permissions before proceeding
    if (
      !guild.members.me?.permissions.has([
        'ManageChannels',
        'ViewChannel',
      ] as PermissionResolvable)
    ) {
      return interaction.editReply({
        embeds: [MinaEmbed.error(mina.say('error.missingPermissions'))],
      })
    }

    // Build category permission overwrites (bot, admin who ran command, staff roles)
    const categoryPerms: any[] = [
      {
        id: guild.roles.everyone,
        deny: ['ViewChannel'],
      },
      {
        id: guild.members.me?.id ?? guild.client.user?.id,
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
    let parent: CategoryChannel | null | undefined
    if (catName) {
      // Find topic category by name
      const topicCategory = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name === catName
      ) as CategoryChannel | undefined
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
      const categoryId = settings.ticket.category
      if (categoryId) {
        const channel = guild.channels.cache.get(categoryId)
        if (channel && channel.type === ChannelType.GuildCategory) {
          parent = channel as CategoryChannel
        } else {
          parent = null
        }
      }

      if (!parent) {
        // Create default "Tickets" category
        parent = await guild.channels.create({
          name: 'Tickets',
          type: ChannelType.GuildCategory,
          permissionOverwrites: categoryPerms,
        })
        settings.ticket.category = parent.id
        settings.ticket.enabled = true
        await settings.save()
      }
    }

    // Create ticket channel - inherit category perms first, then add user
    // Don't set explicit perms, let it inherit from category, then add user override
    if (!parent) {
      throw new Error('Parent category is required but not found')
    }

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
    } catch (_permError) {
      // If we can't add user perms, try to delete the channel and report error
      try {
        await tktChannel.delete()
      } catch {
        // Ignore deletion error
      }
      return interaction.editReply({
        embeds: [
          MinaEmbed.error(
            'failed to create ticket channel due to permission issues.\n\n' +
              'please check that i have the **manage channels** permission and that my role is above the ticket category.'
          ),
        ],
      })
    }

    const embed = MinaEmbed.primary()
      .setAuthor({
        name: mina.sayf('ticket.createEmbed.title', { number: ticketNumber }),
      })
      .setDescription(
        mina.sayf('ticket.createEmbed.description', {
          user: user.toString(),
          topic: catName
            ? mina.sayf('ticket.createEmbed.topic', { topic: catName })
            : '',
        })
      )
      .setFooter({
        text: mina.say('ticket.createEmbed.footer'),
      })

    const buttonsRow = MinaRows.from(
      MinaButtons.close('TICKET_CLOSE').setLabel(
        mina.say('ticket.createEmbed.button')
      )
    )

    const sent = await tktChannel.send({
      content: user.toString(),
      embeds: [embed],
      components: [buttonsRow],
    })

    // DM user with ticket link (safe fallback)
    const dmEmbed = MinaEmbed.primary()
      .setAuthor({ name: mina.say('ticket.createEmbed.dmTitle') })
      .setThumbnail(guild.iconURL())
      .setDescription(
        mina.sayf('ticket.createEmbed.dmDescription', {
          server: guild.name,
          topic: catName
            ? mina.sayf('ticket.createEmbed.dmTopic', { topic: catName })
            : '',
        })
      )

    const row = MinaRows.from(
      MinaButtons.link(sent.url, mina.say('ticket.createEmbed.dmButton'))
    )

    // Try to DM, but don't fail if it doesn't work
    try {
      await user.send({ embeds: [dmEmbed], components: [row] })
    } catch (_dmError) {
      // User has DMs disabled or blocked bot - that's okay, continue
    }

    // Reply with success message and link to ticket
    const successEmbed = MinaEmbed.success(
      mina.say('ticket.createEmbed.success')
    )

    const viewTicketButton = MinaRows.from(
      MinaButtons.link(sent.url, mina.say('ticket.createEmbed.dmButton'))
    )

    await interaction.editReply({
      embeds: [successEmbed],
      components: [viewTicketButton],
    })
  } catch (ex: any) {
    error('handleTicketOpen', ex)

    // Provide more specific error messages
    let errorMessage = mina.say('ticket.error.failed')
    if (
      ex.message?.includes('Missing Permissions') ||
      ex.message?.includes('Missing Access')
    ) {
      errorMessage = mina.say('error.missingPermissions')
    } else if (ex.message?.includes('Maximum number of channels')) {
      errorMessage = mina.say('error.maxChannels')
    }

    return interaction.editReply({
      embeds: [MinaEmbed.error(errorMessage)],
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

  // Validate that interaction.channel exists and is a guild text channel
  if (
    !interaction.channel ||
    interaction.channel.type !== ChannelType.GuildText
  ) {
    await interaction.followUp({
      content: 'This command can only be used in a guild text channel.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const status = await closeTicket(
    interaction.channel as BaseGuildTextChannel,
    interaction.user
  )
  if (status === 'MISSING_PERMISSIONS') {
    await interaction.followUp({
      content: mina.say('ticket.closeEmbed.noPermission'),
      flags: MessageFlags.Ephemeral,
    })
    return
  } else if (status === 'ERROR') {
    await interaction.followUp({
      content: mina.say('ticket.closeEmbed.failed'),
      flags: MessageFlags.Ephemeral,
    })
    return
  } else if (status === 'SUCCESS') {
    // Ticket closed successfully - the closeTicket function already sent the embed
    // Just acknowledge the interaction
    await interaction.followUp({
      content: mina.say('ticket.closeEmbed.success'),
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
    const content = mina.say('ticket.delete.invalidData')
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content,
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content,
        flags: MessageFlags.Ephemeral,
      })
    }
    return
  }

  // Try to get channel - might be in cache or need to fetch
  const guild = interaction.guild
  if (!guild) return
  let channel: import('discord.js').GuildBasedChannel | null | undefined =
    guild.channels.cache.get(channelId)

  if (!channel) {
    // Try to fetch the channel
    try {
      channel = await guild.channels.fetch(channelId)
    } catch (_fetchError) {
      // Channel doesn't exist or we can't access it
      const content = mina.say('ticket.delete.notFound')
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content,
          flags: MessageFlags.Ephemeral,
        })
      } else {
        await interaction.reply({
          content,
          flags: MessageFlags.Ephemeral,
        })
      }
      return
    }
  }

  if (!channel || channel.type !== ChannelType.GuildText) {
    const content = mina.say('ticket.delete.cannotDelete')
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content,
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content,
        flags: MessageFlags.Ephemeral,
      })
    }
    return
  }

  const textChannel = channel as BaseGuildTextChannel
  if (!textChannel.deletable) {
    const content = mina.say('ticket.delete.noPermission')
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content,
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content,
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
      content: mina.say('ticket.delete.success'),
      flags: MessageFlags.Ephemeral,
    })
  } catch (error: any) {
    await interaction.followUp({
      content: mina.sayf('ticket.delete.failed', {
        error: error.message || 'unknown error',
      }),
      flags: MessageFlags.Ephemeral,
    })
  }
}
