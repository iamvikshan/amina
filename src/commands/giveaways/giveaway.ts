import {
  ChannelType,
  ComponentType,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  Guild,
} from 'discord.js'
import type { GuildTextBasedChannel, PermissionResolvable } from 'discord.js'
import { parsePermissions } from '@helpers/Utils'
import ems from 'enhanced-ms'
import { GIVEAWAYS } from '@src/config'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

import start from './sub/start'
import pause from './sub/pause'
import resume from './sub/resume'
import end from './sub/end'
import reroll from './sub/reroll'
import list from './sub/list'
import edit from './sub/edit'

const command: CommandData = {
  name: 'giveaway',
  description: 'giveaway commands',
  category: 'GIVEAWAY',
  slashCommand: {
    enabled: GIVEAWAYS.ENABLED,
    ephemeral: true,
    options: [
      {
        name: 'start',
        description: 'start a giveaway',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'the channel to start the giveaway in',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ],
            required: true,
          },
        ],
      },
      {
        name: 'pause',
        description: 'pause a giveaway',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message_id',
            description: 'the message id of the giveaway',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'resume',
        description: 'resume a paused giveaway',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message_id',
            description: 'the message id of the giveaway',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'end',
        description: 'end a giveaway',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message_id',
            description: 'the message id of the giveaway',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'reroll',
        description: 'reroll a giveaway',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message_id',
            description: 'the message id of the giveaway',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'list',
        description: 'list all giveaways',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'edit',
        description: 'edit a giveaway',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message_id',
            description: 'the message id of the giveaway',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'add_duration',
            description:
              'the number of minutes to add to the giveaway duration',
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
          {
            name: 'new_prize',
            description: 'the new prize',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
          {
            name: 'new_winners',
            description: 'the new number of winners',
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    let response

    if (sub === 'start') {
      const channel = interaction.options.getChannel('channel')
      if (!channel) {
        return interaction.followUp(mina.say('giveaway.start.error.noChannel'))
      }
      await interaction.followUp(mina.say('giveaway.start.processing'))
      return await runModalSetup(interaction, channel as GuildTextBasedChannel)
    } else if (sub === 'pause') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp(mina.say('giveaway.error.noMessageId'))
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp(mina.say('errors.memberNotFound'))
      }
      response = await pause(member, messageId)
    } else if (sub === 'resume') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp(mina.say('giveaway.error.noMessageId'))
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp(mina.say('errors.memberNotFound'))
      }
      response = await resume(member, messageId)
    } else if (sub === 'end') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp(mina.say('giveaway.error.noMessageId'))
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp(mina.say('errors.memberNotFound'))
      }
      response = await end(member, messageId)
    } else if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp(mina.say('giveaway.error.noMessageId'))
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp(mina.say('errors.memberNotFound'))
      }
      response = await reroll(member, messageId)
    } else if (sub === 'list') {
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp(mina.say('errors.memberNotFound'))
      }
      response = await list(member)
    } else if (sub === 'edit') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp(mina.say('giveaway.error.noMessageId'))
      }
      const addDur = interaction.options.getString('add_duration')
      let addDurationMs: number | null = null
      if (addDur !== null) {
        const parsed = ems(addDur)
        if (isNaN(parsed)) {
          return interaction.followUp(
            mina.say('giveaway.edit.error.invalidDuration')
          )
        }
        addDurationMs = parsed
      }
      const newPrize = interaction.options.getString('new_prize')
      const newWinnerCount = interaction.options.getInteger('new_winners')
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp(mina.say('errors.memberNotFound'))
      }
      response = await edit(
        member,
        messageId,
        addDurationMs,
        newPrize,
        newWinnerCount
      )
    } else {
      response = mina.say('errors.invalidSubcommand')
    }

    await interaction.followUp(response)
  },
}

// Modal Giveaway setup
async function runModalSetup(
  interaction: ChatInputCommandInteraction,
  targetCh: GuildTextBasedChannel
) {
  const member = interaction.member as GuildMember
  const channel = interaction.channel as TextChannel
  const guild = interaction.guild as Guild

  if (!member || !channel || !guild) {
    return channel.safeSend(mina.say('errors.missingInfo'))
  }

  const SETUP_PERMS: PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'EmbedLinks',
  ]

  // validate channel perms
  if (!targetCh) {
    return channel.safeSend(mina.say('giveaway.setup.error.noChannel'))
  }

  // FIX: Correct the channel type and permission check logic
  if (
    (targetCh.type !== ChannelType.GuildText &&
      targetCh.type !== ChannelType.GuildAnnouncement) ||
    !targetCh.permissionsFor(guild.members.me!)?.has(SETUP_PERMS)
  ) {
    return channel.safeSend(
      mina.sayf('giveaway.setup.error.noPermission', {
        perms: parsePermissions(SETUP_PERMS),
        channel: targetCh.toString(),
      })
    )
  }

  const buttonRow = MinaRows.from(
    MinaButtons.custom('giveaway_btnSetup', mina.say('giveaway.setup.button'))
  )

  const sentMsg = await channel.safeSend({
    content: mina.say('giveaway.setup.prompt'),
    components: [buttonRow],
  })

  if (!sentMsg) return

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i =>
        i.customId === 'giveaway_btnSetup' &&
        (i.member as GuildMember)?.id === member.id &&
        i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch(() => null)

  if (!btnInteraction) {
    return sentMsg.edit({
      content: mina.say('giveaway.setup.cancelled'),
      components: [],
    })
  }

  // display modal
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: 'giveaway-modalSetup',
      title: mina.say('giveaway.setup.modal.title'),
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'duration',
            label: mina.say('giveaway.setup.modal.duration.label'),
            placeholder: mina.say('giveaway.setup.modal.duration.placeholder'),
            style: TextInputStyle.Short,
            required: true,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'prize',
            label: mina.say('giveaway.setup.modal.prize.label'),
            placeholder: mina.say('giveaway.setup.modal.prize.placeholder'),
            style: TextInputStyle.Short,
            required: true,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'winners',
            label: mina.say('giveaway.setup.modal.winners.label'),
            placeholder: mina.say('giveaway.setup.modal.winners.placeholder'),
            style: TextInputStyle.Short,
            required: true,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'roles',
            label: mina.say('giveaway.setup.modal.roles.label'),
            placeholder: mina.say('giveaway.setup.modal.roles.placeholder'),
            style: TextInputStyle.Short,
            required: false,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'host',
            label: mina.say('giveaway.setup.modal.host.label'),
            placeholder: mina.say('giveaway.setup.modal.host.placeholder'),
            style: TextInputStyle.Short,
            required: false,
          })
        ),
      ],
    })
  )

  // receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: m =>
        m.customId === 'giveaway-modalSetup' &&
        (m.member as GuildMember)?.id === member.id &&
        m.message?.id === sentMsg.id,
    })
    .catch(() => null)

  if (!modal) {
    return sentMsg.edit({
      content: mina.say('giveaway.setup.cancelled'),
      components: [],
    })
  }

  sentMsg.delete().catch(() => {})
  await modal.reply(mina.say('giveaway.setup.processing'))

  // duration
  const durationValue = ems(modal.fields.getTextInputValue('duration'))
  if (typeof durationValue !== 'number' || isNaN(durationValue)) {
    return modal.editReply(mina.say('giveaway.setup.error.invalidDuration'))
  }
  const duration = durationValue

  // prize
  const prize = modal.fields.getTextInputValue('prize')

  // winner count
  const winnersValue = parseInt(modal.fields.getTextInputValue('winners'))
  if (typeof winnersValue !== 'number' || isNaN(winnersValue)) {
    return modal.editReply(mina.say('giveaway.setup.error.invalidWinners'))
  }
  const winners = winnersValue

  // roles
  const allowedRoles =
    modal.fields
      .getTextInputValue('roles')
      ?.split(',')
      ?.filter(roleId => guild.roles.cache.get(roleId.trim())) || []

  // host
  const hostId = modal.fields.getTextInputValue('host')
  let host = null
  if (hostId) {
    try {
      host = await guild.client.users.fetch(hostId)
    } catch (ex) {
      return modal.editReply(mina.say('giveaway.setup.error.invalidHost'))
    }
  }

  const response = await start(
    member,
    targetCh,
    duration,
    prize,
    winners,
    host,
    allowedRoles
  )
  await modal.editReply(response)
}

// NOTE: runModalEdit function was removed as it appears to be unused dead code

export default command
