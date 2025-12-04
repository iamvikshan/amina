import inviteHandler from '@handlers/invite'
import { INVITE } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
  User,
  GuildMember,
  Role,
  ChannelType,
} from 'discord.js'
import { getMember } from '@schemas/Member'
import { stripIndent } from 'common-tags'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const {
  getEffectiveInvites,
  checkInviteRewards,
  cacheGuildInvites,
  resetInviteCache,
} = inviteHandler

const command: CommandData = {
  name: 'invite',
  description: 'track invites, view codes, manage invite ranks and rewards',
  category: 'INVITE',
  botPermissions: ['EmbedLinks', 'ManageGuild'],

  slashCommand: {
    enabled: INVITE.ENABLED,
    options: [
      // User commands
      {
        name: 'view',
        description: 'check invite count for yourself or another user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to check invites for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'codes',
        description: 'list all invite codes you or another user created',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to get invite codes for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'inviter',
        description: 'see who invited a user to the server',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to check the inviter for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'ranks',
        description: 'display configured invite rank rewards',
        type: ApplicationCommandOptionType.Subcommand,
      },
      // Admin commands
      {
        name: 'reset',
        description: 'clear added invites for a user (admin)',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to reset invites for',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'import',
        description:
          'sync existing guild invites to the tracking system (admin)',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'specific user to import invites for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'rank',
        description: 'manage invite rank rewards (admin)',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'create a new invite rank reward (admin)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role',
                description: 'role to grant at this rank',
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
              {
                name: 'invites',
                description: 'invites required to earn this rank',
                type: ApplicationCommandOptionType.Integer,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'delete an invite rank reward (admin)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role',
                description: 'role to remove from ranks',
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'tracking',
        description:
          'enable or disable invite tracking for this server (admin)',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'on or off',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: 'ON',
                value: 'ON',
              },
              {
                name: 'OFF',
                value: 'OFF',
              },
            ],
          },
        ],
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: { settings: any }
  ) {
    const sub = interaction.options.getSubcommand()
    const group = interaction.options.getSubcommandGroup()
    let response: string | { embeds: MinaEmbed[] } = 'Invalid subcommand'

    if (!interaction.guild) {
      return interaction.followUp('This command can only be used in a server.')
    }

    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp('Could not find member information.')
    }

    // Check permissions for admin commands
    const adminCommands = ['reset', 'import', 'rank', 'tracking']
    const isAdminCommand = adminCommands.includes(sub) || group === 'rank'

    if (isAdminCommand && !member.permissions.has('ManageGuild')) {
      return interaction.followUp(
        "You need 'Manage Server' permission to use this command."
      )
    }

    const settings = data?.settings || {}

    // Handle regular user commands
    switch (sub) {
      case 'view': {
        const user = interaction.options.getUser('user') || interaction.user
        response = await getInvites(interaction.guild, user, settings)
        break
      }

      case 'codes': {
        const user = interaction.options.getUser('user') || interaction.user
        response = await getInviteCodes(interaction.guild, user)
        break
      }

      case 'inviter': {
        const user = interaction.options.getUser('user') || interaction.user
        response = await getInviter(interaction.guild, user, settings)
        break
      }

      case 'ranks': {
        response = await getInviteRanks(interaction.guild, settings)
        break
      }

      // Handle admin commands
      case 'reset': {
        const user = interaction.options.getUser('user')
        if (!user) {
          return interaction.followUp('Please specify a user.')
        }
        response = await clearInvites(interaction.guild, user)
        break
      }

      case 'import': {
        const user = interaction.options.getUser('user')
        response = await importInvites(interaction.guild, user)
        break
      }

      case 'tracking': {
        const status = interaction.options.getString('status')
        if (!status) {
          return interaction.followUp('Please specify a status.')
        }
        response = await setStatus(interaction.guild, status, settings)
        break
      }

      default: {
        if (group === 'rank') {
          const role = interaction.options.getRole('role')
          if (!role) {
            return interaction.followUp('Please specify a role.')
          }
          if (sub === 'add') {
            const invites = interaction.options.getInteger('invites')
            if (!invites) {
              return interaction.followUp(
                'Please specify the number of invites.'
              )
            }
            response = await addInviteRank(
              interaction.guild,
              role as Role,
              invites,
              settings
            )
          } else if (sub === 'remove') {
            response = await removeInviteRank(
              interaction.guild,
              role as Role,
              settings
            )
          }
        }
      }
    }

    return interaction.followUp(response)
  },
}

async function getInvites(guild: Guild, user: User, settings: any) {
  if (!settings.invite?.tracking)
    return `Invite tracking is disabled in this server`

  const memberDb = (await getMember(guild.id, user.id)) as any as IMember
  const inviteData = memberDb.invite_data

  if (!inviteData) {
    return `No invite data found for ${user.username}`
  }

  const embed = MinaEmbed.primary()
    .setAuthor({ name: `invites for ${user.username}` })
    .setThumbnail(user.displayAvatarURL())
    .setDescription(
      `${user.toString()} has ${getEffectiveInvites(inviteData)} invites`
    )
    .addFields(
      {
        name: 'total invites',
        value: `**${inviteData?.tracked + inviteData?.added || 0}**`,
        inline: true,
      },
      {
        name: 'fake invites',
        value: `**${inviteData?.fake || 0}**`,
        inline: true,
      },
      {
        name: 'left invites',
        value: `**${inviteData?.left || 0}**`,
        inline: true,
      }
    )

  return { embeds: [embed] }
}

async function getInviteCodes(guild: Guild, user: User) {
  const invites = await guild.invites.fetch({ cache: false })
  const reqInvites = invites.filter(inv => inv.inviter?.id === user.id)
  if (reqInvites.size === 0)
    return `\`${user.username}\` has no invites in this server`

  let str = ''
  reqInvites.forEach(inv => {
    str += `❯ [${inv.code}](${inv.url}) : ${inv.uses} uses\n`
  })

  const embed = MinaEmbed.primary()
    .setAuthor({ name: `invite code for ${user.username}` })
    .setDescription(str)

  return { embeds: [embed] }
}

async function getInviter(guild: Guild, user: User, settings: any) {
  if (!settings.invite?.tracking)
    return `Invite tracking is disabled in this server`

  const memberDb = (await getMember(guild.id, user.id)) as any as IMember
  const inviteData = memberDb.invite_data

  if (!inviteData || !inviteData.inviter) {
    return `Cannot track how \`${user.username}\` joined`
  }

  let inviter
  try {
    inviter = await guild.client.users.fetch(inviteData.inviter, {
      cache: false,
    })
  } catch (_ex) {
    return `Cannot fetch inviter information for \`${user.username}\``
  }

  const inviterDb = (await getMember(
    guild.id,
    inviteData.inviter
  )) as any as IMember
  const inviterData = inviterDb.invite_data

  const embed = MinaEmbed.primary()
    .setAuthor({ name: `invite data for ${user.username}` })
    .setDescription(
      stripIndent`
      inviter: \`${inviter?.username || 'Deleted User'}\`
      inviter id: \`${inviteData.inviter}\`
      invite code: \`${inviteData.code || 'N/A'}\`
      inviter invites: \`${getEffectiveInvites(inviterData)}\`
      `
    )

  return { embeds: [embed] }
}

async function getInviteRanks(guild: Guild, settings: any) {
  if (!settings.invite?.ranks || settings.invite.ranks.length === 0)
    return 'No invite ranks configured in this server'
  let str = ''

  settings.invite.ranks.forEach((data: any) => {
    const roleName = guild.roles.cache.get(data._id)?.toString()
    if (roleName) {
      str += `❯ ${roleName}: ${data.invites} invites\n`
    }
  })

  if (!str) return 'No invite ranks configured in this server'

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'invite ranks' })
    .setDescription(str)
  return { embeds: [embed] }
}

async function clearInvites(guild: Guild, user: User) {
  const memberDb = (await getMember(guild.id, user.id)) as any as IMember
  if (!memberDb.invite_data) {
    memberDb.invite_data = {
      tracked: 0,
      added: 0,
      fake: 0,
      left: 0,
    }
  }
  memberDb.invite_data.added = 0
  await memberDb.save()
  checkInviteRewards(guild, memberDb, false)
  return `Done! Invites cleared for \`${user.username}\``
}

async function importInvites(guild: Guild, user: User | null) {
  if (user && user.bot) return 'Oops! You cannot import invites for bots'

  const invites = await guild.invites.fetch({ cache: false })

  // temporary store for invites
  const tempMap = new Map<string, number>()

  for (const invite of invites.values()) {
    const inviter = invite.inviter
    const uses = invite.uses ?? 0
    if (!inviter || uses === 0) continue
    if (!tempMap.has(inviter.id)) tempMap.set(inviter.id, uses)
    else {
      const currentUses = (tempMap.get(inviter.id) ?? 0) + uses
      tempMap.set(inviter.id, currentUses)
    }
  }

  for (const [userId, uses] of tempMap.entries()) {
    const memberDb = (await getMember(guild.id, userId)) as any as IMember
    if (!memberDb.invite_data) {
      memberDb.invite_data = {
        tracked: 0,
        added: 0,
        fake: 0,
        left: 0,
      }
    }
    memberDb.invite_data.added += uses
    await memberDb.save()
  }

  return `Done! Previous invites added to ${user ? user.username : 'all members'}`
}

async function addInviteRank(
  guild: Guild,
  role: Role,
  invites: number,
  settings: any
) {
  if (!settings.invite?.tracking)
    return `Invite tracking is disabled in this server`

  if (role.managed) {
    return 'You cannot assign a bot role'
  }

  if (guild.roles.everyone.id === role.id) {
    return 'I cannot assign the everyone role.'
  }

  if (!role.editable) {
    return 'I am missing permissions to move members to that role. Is that role below my highest role?'
  }

  const exists = settings.invite.ranks.find((obj: any) => obj._id === role.id)

  let msg = ''
  if (exists) {
    exists.invites = invites
    msg += 'Previous configuration found for this role. Overwriting data\n'
  } else {
    settings.invite.ranks.push({ _id: role.id, invites })
  }

  await settings.save()
  return `${msg}Success! Configuration saved.`
}

async function removeInviteRank(guild: Guild, role: Role, settings: any) {
  if (!settings.invite?.tracking)
    return `Invite tracking is disabled in this server`

  if (role.managed) {
    return 'You cannot assign a bot role'
  }

  if (guild.roles.everyone.id === role.id) {
    return 'You cannot assign the everyone role.'
  }

  if (!role.editable) {
    return 'I am missing permissions to move members from that role. Is that role below my highest role?'
  }

  const exists = settings.invite.ranks.find((obj: any) => obj._id === role.id)
  if (!exists)
    return 'No previous invite rank is configured found for this role'

  // Delete element from the array
  const i = settings.invite.ranks.findIndex((obj: any) => obj._id === role.id)
  if (i > -1) settings.invite.ranks.splice(i, 1)

  await settings.save()
  return 'Success! Configuration saved.'
}

async function setStatus(guild: Guild, input: string, settings: any) {
  const status = input.toUpperCase() === 'ON' ? true : false

  if (status) {
    const me = guild.members.me
    if (!me) {
      return 'Cannot check bot permissions.'
    }
    if (!me.permissions.has(['ManageGuild', 'ManageChannels'])) {
      return 'Oops! I am missing `Manage Server`, `Manage Channels` permission!\nI cannot track invites'
    }

    const channelMissing = guild.channels.cache
      .filter(
        ch =>
          ch.type === ChannelType.GuildText &&
          !ch.permissionsFor(me).has('ManageChannels')
      )
      .map(ch => ch.name)

    if (channelMissing.length > 1) {
      return `I may not be able to track invites properly\nI am missing \`Manage Channel\` permission in the following channels \`\`\`${channelMissing.join(
        ', '
      )}\`\`\``
    }

    await cacheGuildInvites(guild)
  } else {
    resetInviteCache(guild)
  }

  settings.invite.tracking = status
  await settings.save()

  return `Configuration saved! Invite tracking is now ${status ? 'enabled' : 'disabled'}`
}

export default command
