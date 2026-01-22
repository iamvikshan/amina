import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  ChannelType,
  TextChannel,
  Guild,
  GuildMember,
  ActionRowBuilder,
} from 'discord.js'
import { getSettings, updateSettings } from '@src/database/schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButton, MinaRow } from '@structures/components'
import { mina } from '@helpers/mina'

export async function ticketModalSetup(
  interaction: {
    guild: Guild
    channel: TextChannel
    member: GuildMember
  },
  targetChannel: TextChannel
): Promise<void> {
  const { guild, channel, member } = interaction

  const buttonRow = MinaRow.of(
    MinaButton.go('ticket_btnSetup').setLabel('setup message')
  )

  const sentMsg = await channel.send({
    embeds: [
      MinaEmbed.primary().setDescription(
        mina.say('ticket.setup.message.description')
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
        MinaEmbed.error().setDescription(
          mina.say('ticket.setup.message.cancelled')
        ),
      ],
      components: [],
    })
    return
  }

  // display modal
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: 'ticket-modalSetup',
      title: mina.say('ticket.setup.message.title'),
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('embed title')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('embed description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('footer')
            .setLabel('embed footer')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  )

  // receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 60 * 10000,
      filter: m =>
        m.customId === 'ticket-modalSetup' &&
        m.member?.user.id === member.id &&
        m.message?.id === sentMsg.id,
    })
    .catch(() => null)

  if (!modal) {
    await sentMsg.edit({
      embeds: [
        MinaEmbed.error().setDescription(
          mina.say('ticket.setup.message.cancelled')
        ),
      ],
      components: [],
    })
    return
  }

  await modal.reply({
    embeds: [
      MinaEmbed.primary().setDescription(
        mina.say('ticket.setup.message.processing')
      ),
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
  const embed = MinaEmbed.primary()
    .setAuthor({ name: title || 'support ticket' })
    .setDescription(
      description || 'please use the button below to create a ticket'
    )
    .setFooter({ text: footer || 'you can only have 1 open ticket at a time!' })

  const tktBtnRow = MinaRow.of(
    MinaButton.go('TICKET_CREATE').setLabel('open a ticket')
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
      MinaEmbed.success().setDescription(
        mina.say('ticket.setup.message.success')
      ),
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
    return mina.sayf('ticket.setup.message.noPermission', {
      channel: target.toString(),
    })

  settings.ticket.log_channel = target.id
  await settings.save()

  return mina.sayf('ticket.setup.message.logChannelSaved', {
    channel: target.toString(),
  })
}

export async function setupLimit(
  limit: number,
  settings: any
): Promise<string> {
  if (Number.parseInt(limit.toString(), 10) < 5)
    return mina.say('ticket.setup.message.limitTooLow')

  settings.ticket.limit = limit
  await settings.save()

  return mina.sayf('ticket.setup.message.limitSaved', {
    limit: limit.toString(),
  })
}

export default 0
