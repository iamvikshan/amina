import {
  ChannelType,
  ButtonBuilder,
  ActionRowBuilder,
  ComponentType,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  ButtonStyle,
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
        return interaction.followUp('Please provide a channel!')
      }
      await interaction.followUp('Starting Giveaway system...')
      return await runModalSetup(interaction, channel as GuildTextBasedChannel)
    } else if (sub === 'pause') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp('Please provide a message ID!')
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information!')
      }
      response = await pause(member, messageId)
    } else if (sub === 'resume') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp('Please provide a message ID!')
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information!')
      }
      response = await resume(member, messageId)
    } else if (sub === 'end') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp('Please provide a message ID!')
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information!')
      }
      response = await end(member, messageId)
    } else if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp('Please provide a message ID!')
      }
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information!')
      }
      response = await reroll(member, messageId)
    } else if (sub === 'list') {
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information!')
      }
      response = await list(member)
    } else if (sub === 'edit') {
      const messageId = interaction.options.getString('message_id')
      if (!messageId) {
        return interaction.followUp('Please provide a message ID!')
      }
      const addDur = interaction.options.getString('add_duration')
      let addDurationMs: number | null = null
      if (addDur !== null) {
        const parsed = ems(addDur)
        if (isNaN(parsed)) {
          return interaction.followUp('Not a valid duration')
        }
        addDurationMs = parsed
      }
      const newPrize = interaction.options.getString('new_prize')
      const newWinnerCount = interaction.options.getInteger('new_winners')
      const member = interaction.member as GuildMember
      if (!member) {
        return interaction.followUp('Could not find member information!')
      }
      response = await edit(
        member,
        messageId,
        addDurationMs,
        newPrize,
        newWinnerCount
      )
    } else {
      response = 'Invalid subcommand'
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
    return channel.safeSend('Missing required information!')
  }

  const SETUP_PERMS: PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'EmbedLinks',
  ]

  // validate channel perms
  if (!targetCh) {
    return channel.safeSend(
      'Giveaway setup has been cancelled. You did not mention a channel'
    )
  }

  // FIX: Correct the channel type and permission check logic
  if (
    (targetCh.type !== ChannelType.GuildText &&
      targetCh.type !== ChannelType.GuildAnnouncement) ||
    !targetCh.permissionsFor(guild.members.me!)?.has(SETUP_PERMS)
  ) {
    return channel.safeSend(
      `Giveaway setup has been cancelled.\nI need ${parsePermissions(SETUP_PERMS)} in ${targetCh}`
    )
  }

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_btnSetup')
      .setLabel('Setup Giveaway')
      .setStyle(ButtonStyle.Primary)
  )

  const sentMsg = await channel.safeSend({
    content: 'Please click the button below to setup new giveaway',
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
      content: 'No response received, cancelling setup',
      components: [],
    })
  }

  // display modal
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: 'giveaway-modalSetup',
      title: 'Giveaway Setup',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'duration',
            label: 'What is the duration?',
            placeholder: '1h / 1d / 1w',
            style: TextInputStyle.Short,
            required: true,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'prize',
            label: 'What is the prize?',
            placeholder: 'Nitro / Steam Gift Card / etc',
            style: TextInputStyle.Short,
            required: true,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'winners',
            label: 'Number of winners?',
            placeholder: '1, 20',
            style: TextInputStyle.Short,
            required: true,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'roles',
            label: "RoleId's that can take part in the giveaway",
            placeholder: '1161271489446809611, 1167163232117600256',
            style: TextInputStyle.Short,
            required: false,
          })
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'host',
            label: 'User Id hosting the giveaway',
            placeholder: '929835843479302204',
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
      content: 'No response received, cancelling setup',
      components: [],
    })
  }

  sentMsg.delete().catch(() => {})
  await modal.reply('Setting up giveaway...')

  // duration
  const durationValue = ems(modal.fields.getTextInputValue('duration'))
  if (typeof durationValue !== 'number' || isNaN(durationValue)) {
    return modal.editReply(
      'Setup has been cancelled. You did not specify a valid duration'
    )
  }
  const duration = durationValue

  // prize
  const prize = modal.fields.getTextInputValue('prize')

  // winner count
  const winnersValue = parseInt(modal.fields.getTextInputValue('winners'))
  if (typeof winnersValue !== 'number' || isNaN(winnersValue)) {
    return modal.editReply(
      'Setup has been cancelled. You did not specify a valid winner count'
    )
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
      return modal.editReply(
        'Setup has been cancelled. You need to provide a valid userId for host'
      )
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
