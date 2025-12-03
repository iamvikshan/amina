import {
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  TextChannel,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show channel select for ticket message setup
 */
export async function showMessageChannelSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setAuthor({ name: mina.say('ticket.setup.message.title') })
    .setDescription(mina.say('ticket.setup.message.description'))
    .setFooter({ text: mina.say('ticket.setup.message.footer') })

  const channelSelect =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('ticket:channel:message')
        .setPlaceholder('select a channel...')
        .setChannelTypes(ChannelType.GuildText)
    )

  const backButton = MinaRows.backRow('ticket:btn:back_setup')

  await interaction.update({
    embeds: [embed],
    components: [channelSelect, backButton],
  })
}

/**
 * Handle channel selection for ticket message
 */
export async function handleMessageChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  const channel = interaction.channels.first() as TextChannel

  if (!channel) {
    await interaction.reply({
      content: mina.say('ticket.setup.message.invalidChannel'),
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Check bot permissions
  if (
    !channel.permissionsFor(interaction.guild!.members.me!)?.has('SendMessages')
  ) {
    await interaction.reply({
      embeds: [
        MinaEmbed.error(
          mina.sayf('ticket.setup.message.noPermission', {
            channel: channel.toString(),
          })
        ),
      ],
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Show modal for ticket message customization
  await showTicketMessageModal(interaction, channel)
}

/**
 * Show modal for ticket message customization
 */
async function showTicketMessageModal(
  interaction: ChannelSelectMenuInteraction,
  channel: TextChannel
): Promise<void> {
  const modal = new ModalBuilder({
    customId: `ticket:modal:message|ch:${channel.id}`,
    title: 'ticket message setup',
    components: [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder({
          customId: 'title',
          label: 'embed title',
          style: TextInputStyle.Short,
          placeholder: 'support ticket',
          required: false,
          maxLength: 256,
        })
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder({
          customId: 'description',
          label: 'embed description',
          style: TextInputStyle.Paragraph,
          placeholder: 'please use the button below to create a ticket',
          required: false,
          maxLength: 2048,
        })
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder({
          customId: 'footer',
          label: 'embed footer',
          style: TextInputStyle.Short,
          placeholder: 'you can only have 1 open ticket at a time',
          required: false,
          maxLength: 2048,
        })
      ),
    ],
  })

  await interaction.showModal(modal)
}

/**
 * Handle ticket message modal submission
 */
export async function handleTicketMessageModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  // Extract channel ID from custom_id
  // Format: ticket:modal:message|ch:${channel.id}
  const parts = interaction.customId.split('|')
  const channelPart = parts[1] // Should be "ch:${channel.id}"
  const channelId = channelPart?.split(':')[1]

  if (!channelId) {
    await interaction.reply({
      content: 'invalid channel data',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const channel = interaction.guild!.channels.cache.get(
    channelId
  ) as TextChannel

  if (!channel) {
    await interaction.reply({
      content: 'channel not found',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const title =
    interaction.fields.getTextInputValue('title') || 'support ticket'
  const description =
    interaction.fields.getTextInputValue('description') ||
    'please use the button below to create a ticket'
  const footer =
    interaction.fields.getTextInputValue('footer') ||
    'you can only have 1 open ticket at a time'

  // Get or create ticket category
  const settings = await getSettings(interaction.guild!)
  let ticketCategory = interaction.guild!.channels.cache.get(
    settings.ticket.category || ''
  )

  if (!ticketCategory) {
    try {
      const staffRoles = settings.server.staff_roles || []
      const categoryPerms: any[] = [
        {
          id: interaction.guild!.roles.everyone,
          deny: ['ViewChannel'],
        },
        {
          id: interaction.guild!.members.me!,
          allow: [
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'ManageChannels',
          ],
        },
        {
          id: interaction.user.id,
          allow: [
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'ManageChannels',
          ],
        },
      ]

      // Add staff roles to category
      staffRoles.forEach((roleId: string) => {
        const role = interaction.guild!.roles.cache.get(roleId)
        if (role) {
          categoryPerms.push({
            id: role,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
          })
        }
      })

      ticketCategory = await interaction.guild!.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: categoryPerms,
      })
      settings.ticket.category = ticketCategory.id
      settings.ticket.enabled = true
      await updateSettings(interaction.guild!.id, settings)
    } catch (_error) {
      await interaction.editReply({
        embeds: [
          MinaEmbed.error(
            "i couldn't create the tickets category. please check my permissions."
          ),
        ],
      })
      return
    }
  }

  // Create ticket message embed
  const embed = MinaEmbed.primary()
    .setAuthor({ name: title })
    .setDescription(description)
    .setFooter({ text: footer })

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('open a ticket')
      .setCustomId('TICKET_CREATE')
      .setStyle(ButtonStyle.Success)
  )

  try {
    const ticketMessage = await channel.send({
      embeds: [embed],
      components: [buttonRow],
    })

    // Update settings with message ID
    ;(settings.ticket as any).setup_message_id = ticketMessage.id
    await updateSettings(interaction.guild!.id, settings)

    const successEmbed = MinaEmbed.success(
      `ticket message created successfully in ${channel}.\n\n` +
        `users can now click the button to create tickets.`
    )

    const backRow = MinaRows.backRow('ticket:btn:back_setup')

    await interaction.editReply({
      embeds: [successEmbed],
      components: [backRow],
    })
  } catch (_error) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          `failed to send ticket message to ${channel}. please check my permissions.`
        ),
      ],
    })
  }
}
