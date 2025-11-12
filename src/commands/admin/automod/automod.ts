import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'
import { EMBED_COLORS, AUTOMOD } from '@src/config'
import { stripIndent } from 'common-tags'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'automod',
  description: 'Various automod configuration!',
  category: 'AUTOMOD',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: AUTOMOD.ENABLED,
    ephemeral: true,
    options: [
      {
        name: 'status',
        description: 'Check automod configuration',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'strikes',
        description: 'Set maximum number of strikes before taking an action',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'amount',
            description: 'Number of strikes (default 5)',
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
      {
        name: 'action',
        description:
          'Set action to be performed after receiving maximum strikes',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'action',
            description: 'Action to perform',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: 'TIMEOUT',
                value: 'TIMEOUT',
              },
              {
                name: 'KICK',
                value: 'KICK',
              },
              {
                name: 'BAN',
                value: 'BAN',
              },
            ],
          },
        ],
      },
      {
        name: 'debug',
        description:
          'Enable/disable automod for messages sent by admins & moderators',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'Configuration status',
            required: true,
            type: ApplicationCommandOptionType.String,
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
      {
        name: 'whitelist',
        description: 'View whitelisted channels',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'whitelistadd',
        description: 'Add a channel to the whitelist',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'Channel to add',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
      {
        name: 'whitelistremove',
        description: 'Remove a channel from the whitelist',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'Channel to remove',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, data: any) {
    const sub = interaction.options.getSubcommand()
    const settings = data.settings

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a guild!')
      return
    }

    let response: any

    if (sub === 'status')
      response = await getStatus(settings, interaction.guild)
    else if (sub === 'strikes')
      response = await setStrikes(
        settings,
        interaction.options.getInteger('amount', true)
      )
    else if (sub === 'action')
      response = await setAction(
        settings,
        interaction.guild,
        interaction.options.getString('action', true)
      )
    else if (sub === 'debug')
      response = await setDebug(
        settings,
        interaction.options.getString('status', true)
      )
    else if (sub === 'whitelist') {
      response = getWhitelist(interaction.guild, settings)
    } else if (sub === 'whitelistadd') {
      const channelId = interaction.options.getChannel('channel', true).id
      response = await whiteListAdd(settings, channelId)
    } else if (sub === 'whitelistremove') {
      const channelId = interaction.options.getChannel('channel', true).id
      response = await whiteListRemove(settings, channelId)
    }

    await interaction.followUp(response)
  },
}

async function getStatus(settings: any, guild: Guild): Promise<any> {
  const { automod } = settings

  const logChannel = settings.logs_channel
    ? guild.channels.cache.get(settings.logs_channel)?.toString()
    : 'Not Configured'

  // String Builder
  const desc = stripIndent`
    ❯ **Max Lines**: ${automod.max_lines || 'NA'}
    ❯ **Anti-Massmention**: ${automod.anti_massmention > 0 ? '✓' : '✕'}
    ❯ **Anti-Attachment**: ${automod.anti_attachment ? '✓' : '✕'}
    ❯ **Anti-Links**: ${automod.anti_links ? '✓' : '✕'}
    ❯ **Anti-Invites**: ${automod.anti_invites ? '✓' : '✕'}
    ❯ **Anti-Spam**: ${automod.anti_spam ? '✓' : '✕'}
    ❯ **Anti-Ghostping**: ${automod.anti_ghostping ? '✓' : '✕'}
  `

  const embed = new EmbedBuilder()
    .setAuthor({
      name: 'Automod Configuration',
      iconURL: guild.iconURL() || undefined,
    })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc)
    .addFields(
      {
        name: 'Log Channel',
        value: logChannel || 'Not set',
        inline: true,
      },
      {
        name: 'Max Strikes',
        value: automod.strikes.toString(),
        inline: true,
      },
      {
        name: 'Action',
        value: automod.action,
        inline: true,
      },
      {
        name: 'Debug',
        value: automod.debug ? '✓' : '✕',
        inline: true,
      }
    )

  return { embeds: [embed] }
}

async function setStrikes(settings: any, strikes: number): Promise<string> {
  settings.automod.strikes = strikes
  await settings.save()
  return `Configuration saved! Maximum strikes is set to **${strikes}**!`
}

async function setAction(
  settings: any,
  guild: Guild,
  action: string
): Promise<string> {
  if (action === 'TIMEOUT') {
    if (!guild.members.me?.permissions.has('ModerateMembers')) {
      return 'Oops! I need permission to timeout members!'
    }
  }

  if (action === 'KICK') {
    if (!guild.members.me?.permissions.has('KickMembers')) {
      return 'Oops! I need permission to kick members!'
    }
  }

  if (action === 'BAN') {
    if (!guild.members.me?.permissions.has('BanMembers')) {
      return 'Oops! I need permission to ban members!'
    }
  }

  settings.automod.action = action
  await settings.save()
  return `Configuration saved! Automod action is set to **${action}**!`
}

async function setDebug(settings: any, input: string): Promise<string> {
  const status = input.toLowerCase() === 'on'
  settings.automod.debug = status
  await settings.save()
  return `Configuration saved! Automod debug is now **${status ? 'enabled' : 'disabled'}**!`
}

function getWhitelist(guild: Guild, settings: any): string {
  const whitelist = settings.automod.wh_channels
  if (!whitelist || !whitelist.length) return 'No channels are whitelisted'

  const channels: string[] = []
  for (const channelId of whitelist) {
    const channel = guild.channels.cache.get(channelId)
    if (!channel) continue
    if (channel) channels.push(channel.toString())
  }

  return `Whitelisted channels: ${channels.join(', ')}`
}

async function whiteListAdd(settings: any, channelId: string): Promise<string> {
  if (settings.automod.wh_channels.includes(channelId))
    return 'Channel is already whitelisted'
  settings.automod.wh_channels.push(channelId)
  await settings.save()
  return `Channel whitelisted!`
}

async function whiteListRemove(
  settings: any,
  channelId: string
): Promise<string> {
  if (!settings.automod.wh_channels.includes(channelId))
    return 'Channel is not whitelisted'
  settings.automod.wh_channels.splice(
    settings.automod.wh_channels.indexOf(channelId),
    1
  )
  await settings.save()
  return `Channel removed from whitelist!`
}

export default command
