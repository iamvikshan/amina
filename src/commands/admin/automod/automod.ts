import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'
import { AUTOMOD } from '@src/config'
import { stripIndent } from 'common-tags'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'automod',
  description: 'configure automated moderation rules and punishment thresholds',
  category: 'AUTOMOD',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: AUTOMOD.ENABLED,
    ephemeral: true,
    options: [
      {
        name: 'status',
        description: 'view current automod configuration',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'strikes',
        description: 'set max strikes before punishment',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'amount',
            description: 'number of strikes allowed',
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
      {
        name: 'action',
        description: 'set punishment when max strikes reached',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'action',
            description: 'timeout, kick, or ban',
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
        description: 'toggle automod for staff messages',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'status',
            description: 'on or off',
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
        description: 'view channels exempt from automod',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'whitelistadd',
        description: 'exempt a channel from automod',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'channel to whitelist',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
      {
        name: 'whitelistremove',
        description: 'remove a channel from the whitelist',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'channel to remove',
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
    return
  },
}

async function getStatus(settings: any, guild: Guild): Promise<any> {
  const { automod } = settings

  const logChannel = settings.logs_channel
    ? guild.channels.cache.get(settings.logs_channel)?.toString()
    : 'not configured'

  // String Builder
  const desc = stripIndent`
    > **max lines**: ${automod.max_lines || 'NA'}
    > **anti-massmention**: ${automod.anti_massmention > 0 ? 'yes' : 'no'}
    > **anti-attachment**: ${automod.anti_attachment ? 'yes' : 'no'}
    > **anti-links**: ${automod.anti_links ? 'yes' : 'no'}
    > **anti-invites**: ${automod.anti_invites ? 'yes' : 'no'}
    > **anti-spam**: ${automod.anti_spam ? 'yes' : 'no'}
    > **anti-ghostping**: ${automod.anti_ghostping ? 'yes' : 'no'}
  `

  const embed = MinaEmbed.primary()
    .setAuthor({
      name: 'automod configuration',
      iconURL: guild.iconURL() || undefined,
    })
    .setDescription(desc)
    .addFields(
      {
        name: 'log channel',
        value: logChannel || 'not set',
        inline: true,
      },
      {
        name: 'max strikes',
        value: automod.strikes.toString(),
        inline: true,
      },
      {
        name: 'action',
        value: automod.action,
        inline: true,
      },
      {
        name: 'debug',
        value: automod.debug ? 'yes' : 'no',
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
