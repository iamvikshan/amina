import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonStyle,
  TextInputStyle,
  ComponentType,
  ChannelType,
  TextChannel,
  Guild,
  GuildMember,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings, updateSettings } from '@src/database/schemas/Guild'

export async function ticketModalSetup(
  interaction: {
    guild: Guild
    channel: TextChannel
    member: GuildMember
  },
  targetChannel: TextChannel
): Promise<void> {
  const { guild, channel, member } = interaction

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_btnSetup')
      .setLabel('Setup Message')
      .setStyle(ButtonStyle.Primary)
  )

  const sentMsg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setDescription(
          'Please click the button below to setup the ticket message 🎫'
        ),
    ],
    components: [buttonRow],
  })

  if (!sentMsg) {
    return
  }

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i =>
        i.customId === 'ticket_btnSetup' &&
        i.member?.user.id === member.id &&
        i.message.id === sentMsg.id,
      time: 100000,
    })
    .catch(() => null)

  if (!btnInteraction) {
    await sentMsg.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('No response received, cancelling setup 😔'),
      ],
      components: [],
    })
    return
  }

  // display modal
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: 'ticket-modalSetup',
      title: 'Ticket Setup',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Embed Title')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Embed Description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('footer')
            .setLabel('Embed Footer')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  )

  // receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 10000,
      filter: m =>
        m.customId === 'ticket-modalSetup' &&
        m.member?.user.id === member.id &&
        m.message.id === sentMsg.id,
    })
    .catch(() => null)

  if (!modal) {
    await sentMsg.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('No response received, cancelling setup 😔'),
      ],
      components: [],
    })
    return
  }

  await modal.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setDescription('Setting up ticket message... 🎫'),
    ],
  })

  const title = modal.fields.getTextInputValue('title')
  const description = modal.fields.getTextInputValue('description')
  const footer = modal.fields.getTextInputValue('footer')

  // Check if a custom category is set, otherwise create 'Tickets' category
  const settings = await getSettings(guild)
  let ticketCategory = guild.channels.cache.get(settings.ticket.category || '')
  if (!ticketCategory) {
    ticketCategory = await guild.channels.create({
      name: 'Tickets',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    })
    settings.ticket.category = ticketCategory.id
    settings.ticket.enabled = true
    await updateSettings(guild.id, settings)
  }

  // send ticket message
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: title || 'Support Ticket' })
    .setDescription(
      description || 'Please use the button below to create a ticket'
    )
    .setFooter({ text: footer || 'You can only have 1 open ticket at a time!' })

  const tktBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Open a ticket')
      .setCustomId('TICKET_CREATE')
      .setStyle(ButtonStyle.Success)
  )

  const ticketMessage = await targetChannel.send({
    embeds: [embed],
    components: [tktBtnRow],
  })

  // Update settings with the new message ID
  ;(settings.ticket as any).setup_message_id = ticketMessage.id
  await updateSettings(guild.id, settings)

  await modal.deleteReply()
  await sentMsg.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setDescription('Yay! Ticket Message Created Successfully! 🎉'),
    ],
    components: [],
  })
}

export async function setupLogChannel(
  target: TextChannel,
  settings: any
): Promise<string> {
  if (
    !target.permissionsFor(target.guild.members.me as any)?.has('SendMessages')
  )
    return `Oops! I don't have permission to send messages to ${target}`

  settings.ticket.log_channel = target.id
  await settings.save()

  return `Configuration saved! Ticket logs will be sent to ${target.toString()}`
}

export async function setupLimit(
  limit: number,
  settings: any
): Promise<string> {
  if (Number.parseInt(limit.toString(), 10) < 5)
    return 'Ticket limit cannot be less than 5'

  settings.ticket.limit = limit
  await settings.save()

  return `Configuration saved. You can now have a maximum of \`${limit}\` open tickets`
}

export default 0
