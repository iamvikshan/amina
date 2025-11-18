import inviteHandler from '@handlers/invite'
import { EMBED_COLORS, INVITE } from '@src/config'
import {
  EmbedBuilder,
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
import type { Command } from '@structures/Command'

const {
  getEffectiveInvites,
  checkInviteRewards,
  cacheGuildInvites,
  resetInviteCache,
} = inviteHandler

const command: Command = {
  name: 'invite',
  description: 'Invite management system',
  category: 'INVITE',
  botPermissions: ['EmbedLinks', 'ManageGuild'],

  slashCommand: {
    enabled: INVITE.ENABLED,
    options: [
      // User commands
      {
        name: 'view',
        description: 'Shows the number of invites in this server',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to get the invites for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'codes',
        description: 'List all your invite codes in this guild',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to get the invite codes for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'inviter',
        description: 'Shows inviter information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to get the inviter information for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'ranks',
        description: 'Shows the invite ranks configured on this guild',
        type: ApplicationCommandOptionType.Subcommand,
      },
      // Admin commands
      {
        name: 'add',
        description: '[ADMIN] Add invites to a member',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to give invites to',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'invites',
            description: 'the number of invites to give',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'reset',
        description: "[ADMIN] Clear a user's added invites",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to clear invites for',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'import',
        description: '[ADMIN] Import existing guild invites',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to import invites for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'rank',
        description: '[ADMIN] Configure invite ranks',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Add a new invite rank',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role',
                description: 'role to be given',
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
              {
                name: 'invites',
                description: 'number of invites required',
                type: ApplicationCommandOptionType.Integer,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Remove an invite rank',
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
        description: '[ADMIN] Configure invite tracking',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'Enable or disable tracking',
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
    let response

    if (!interaction.guild) {
      return interaction.followUp('This command can only be used in a server.')
    }

    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp('Could not find member information.')
    }

    // Check permissions for admin commands
    const adminCommands = ['add', 'reset', 'import', 'rank', 'tracking']
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
      case 'add': {
        const user = interaction.options.getUser('user')
        if (!user) {
          return interaction.followUp('Please specify a user.')
        }
        const amount = interaction.options.getInteger('invites')
        if (!amount) {
          return interaction.followUp('Please specify the number of invites.')
        }
        response = await addInvites(interaction.guild, user, amount)
        break
      }

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
              role,
              invites,
              settings
            )
          } else if (sub === 'remove') {
            response = await removeInviteRank(interaction.guild, role, settings)
          }
        }
      }
    }

    await interaction.followUp(response)
  },
}

async function getInvites(guild: Guild, user: User, settings: any) {
  if (!settings.invite?.tracking)
    return `Invite tracking is disabled in this server`

  const memberDb = await getMember(guild.id, user.id)
  const inviteData = memberDb.invite_data

  if (!inviteData) {
    return `No invite data found for ${user.username}`
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Invites for ${user.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(user.displayAvatarURL())
    .setDescription(
      `${user.toString()} has ${getEffectiveInvites(inviteData)} invites`
    )
    .addFields(
      {
        name: 'Total Invites',
        value: `**${inviteData?.tracked + inviteData?.added || 0}**`,
        inline: true,
      },
      {
        name: 'Fake Invites',
        value: `**${inviteData?.fake || 0}**`,
        inline: true,
      },
      {
        name: 'Left Invites',
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

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Invite code for ${user.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(str)

  return { embeds: [embed] }
}

async function getInviter(guild: Guild, user: User, settings: any) {
  if (!settings.invite?.tracking)
    return `Invite tracking is disabled in this server`

  const memberDb = await getMember(guild.id, user.id)
  const inviteData = memberDb.invite_data

  if (!inviteData || !inviteData.inviter) {
    return `Cannot track how \`${user.username}\` joined`
  }

  let inviter
  try {
    inviter = await guild.client.users.fetch(inviteData.inviter, {
      cache: false,
    })
  } catch (ex) {
    return `Cannot fetch inviter information for \`${user.username}\``
  }

  const inviterDb = await getMember(guild.id, inviteData.inviter)
  const inviterData = inviterDb.invite_data

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `Invite data for ${user.username}` })
    .setDescription(
      stripIndent`
      Inviter: \`${inviter?.username || 'Deleted User'}\`
      Inviter ID: \`${inviteData.inviter}\`
      Invite Code: \`${inviteData.code || 'N/A'}\`
      Inviter Invites: \`${getEffectiveInvites(inviterData)}\`
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

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Invite Ranks' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(str)
  return { embeds: [embed] }
}

async function addInvites(guild: Guild, user: User, amount: number) {
  if (user.bot) return 'Oops! You cannot add invites to bots'

  const memberDb = await getMember(guild.id, user.id)
  if (!memberDb.invite_data) {
    memberDb.invite_data = {
      tracked: 0,
      added: 0,
      fake: 0,
      left: 0,
    }
  }
  memberDb.invite_data.added += amount
  await memberDb.save()

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Added invites to ${user.username}` })
    .setThumbnail(user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(
      `${user.username} now has ${getEffectiveInvites(memberDb.invite_data)} invites`
    )

  checkInviteRewards(guild, memberDb, true)
  return { embeds: [embed] }
}

async function clearInvites(guild: Guild, user: User) {
  const memberDb = await getMember(guild.id, user.id)
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
    if (!inviter || invite.uses === 0) continue
    if (!tempMap.has(inviter.id)) tempMap.set(inviter.id, invite.uses)
    else {
      const uses = tempMap.get(inviter.id)! + invite.uses
      tempMap.set(inviter.id, uses)
    }
  }

  for (const [userId, uses] of tempMap.entries()) {
    const memberDb = await getMember(guild.id, userId)
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
    resetInviteCache(guild.id)
  }

  settings.invite.tracking = status
  await settings.save()

  return `Configuration saved! Invite tracking is now ${status ? 'enabled' : 'disabled'}`
}

export default command
