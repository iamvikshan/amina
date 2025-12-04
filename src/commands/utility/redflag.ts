import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
  User,
} from 'discord.js'
import type { ColorResolvable } from 'discord.js'
import { getUser, removeFlagsByServer } from '@schemas/User'
import { Logger } from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const DANGER_RATINGS: Record<
  number,
  { label: string; color: ColorResolvable }
> = {
  2: { label: 'low risk', color: 0xffff00 },
  4: { label: 'moderate risk', color: 0xff9900 },
  6: { label: 'high risk', color: 0xff6600 },
  8: { label: 'very high risk', color: 0xff3300 },
  10: { label: 'extremely dangerous', color: 0xff0000 },
}

const command: CommandData = {
  name: 'redflag',
  description: 'view crowd-sourced red flags on users',
  cooldown: 5,
  category: 'UTILITY',
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'check',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'view flags on a user',
        options: [
          {
            name: 'user',
            description: 'user to check',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'clear',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'remove flags from a user in this server (admin)',
        options: [
          {
            name: 'user',
            description: 'user to clear flags from',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.followUp(mina.say('serverOnly'))
    }

    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp(mina.say('errors.memberNotFound'))
    }

    const subcommand = interaction.options.getSubcommand()
    const user = interaction.options.getUser('user', true)

    const response = await handleRedFlag(interaction, subcommand, user, member)
    await interaction.followUp(response)
    return
  },
}

async function handleRedFlag(
  interaction: ChatInputCommandInteraction,
  action: string,
  user: User,
  member: GuildMember
): Promise<string | { embeds: any[] }> {
  try {
    let userDb = await getUser(user)

    const isAdmin = member.permissions.has(PermissionFlagsBits.ModerateMembers)

    switch (action) {
      case 'clear': {
        if (!isAdmin) return mina.say('permissions.missing')
        if (!interaction.guild) return mina.say('serverOnly')

        // Get flags from this server only
        const serverFlags =
          userDb.flags?.filter(
            flag => flag.serverId === interaction.guild?.id
          ) || []

        if (serverFlags.length === 0) {
          return mina.say('utility.redflag.error.noFlags')
        }

        await removeFlagsByServer(user.id, interaction.guild.id)
        return mina.sayf('utility.redflag.success.cleared', {
          user: user.tag,
        })
      }

      case 'check': {
        if (!userDb.flags?.length)
          return mina.say('utility.redflag.check.noFlags')

        const flagFields = await Promise.all(
          userDb.flags.map(async (flag, index) => {
            try {
              const flagger = await interaction.client.users.fetch(
                flag.flaggedBy
              )
              const actionTypeLabel = flag.actionType
                ? `[${flag.actionType}] `
                : ''
              return {
                name: mina.sayf('utility.redflag.check.flagNumber', {
                  number: (index + 1).toString(),
                }),
                value: mina.sayf('utility.redflag.check.flagValue', {
                  by: flagger.tag,
                  server: flag.serverName,
                  when: Math.floor(flag.flaggedAt.getTime() / 1000).toString(),
                  reason: `${actionTypeLabel}${flag.reason}`,
                }),
                inline: false,
              }
            } catch (ex) {
              Logger.error('Failed to fetch flagger user', ex)
              const actionTypeLabel = flag.actionType
                ? `[${flag.actionType}] `
                : ''
              return {
                name: mina.sayf('utility.redflag.check.flagNumber', {
                  number: (index + 1).toString(),
                }),
                value: mina.sayf('utility.redflag.check.flagValue', {
                  by: 'deleted user',
                  server: flag.serverName,
                  when: Math.floor(flag.flaggedAt.getTime() / 1000).toString(),
                  reason: `${actionTypeLabel}${flag.reason}`,
                }),
                inline: false,
              }
            }
          })
        )

        const rating = DANGER_RATINGS[userDb.flags.length] || DANGER_RATINGS[5] // Default to max if over 5

        let description = mina.sayf('utility.redflag.check.description', {
          count: userDb.flags.length.toString(),
          plural: userDb.flags.length > 1 ? 's' : '',
          status: rating.label,
        })

        // Add note if user is checking their own flags
        if (user.id === interaction.user.id) {
          description += '\n\n' + mina.say('utility.redflag.check.selfNote')
        }

        const embed = MinaEmbed.info()
          .setTitle(mina.say('utility.redflag.check.title'))
          .setDescription(description)
          .addFields(flagFields)
          .setColor(rating.color)
          .withUser({ user })
          .setFooter({
            text: mina.say('utility.redflag.check.footer'),
          })

        return { embeds: [embed] }
      }

      default:
        return mina.say('error')
    }
  } catch (ex) {
    Logger.error('Red flag command', ex)
    return mina.say('utility.redflag.error.processing')
  }
}

export default command
