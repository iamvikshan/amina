import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
  User,
} from 'discord.js'
import { getUser, addFlag, removeFlag, removeAllFlags } from '@schemas/User'
import { Logger } from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const MAX_FLAGS = 5

const DANGER_RATINGS: Record<number, { label: string; color: number }> = {
  1: { label: 'low risk', color: 0xffff00 },
  2: { label: 'moderate risk', color: 0xff9900 },
  3: { label: 'high risk', color: 0xff6600 },
  4: { label: 'very high risk', color: 0xff3300 },
  5: { label: 'extremely dangerous', color: 0xff0000 },
}

const command: CommandData = {
  name: 'redflag',
  description: 'Manage red flags on users',
  cooldown: 5,
  category: 'UTILITY',

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'add',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Add a red flag to a user',
        options: [
          {
            name: 'user',
            description: 'User to add a red flag to',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'reason',
            description: 'Reason for adding a red flag',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'remove',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Remove your red flag from a user',
        options: [
          {
            name: 'user',
            description: 'User to remove your red flag from',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'check',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Check red flags on a user',
        options: [
          {
            name: 'user',
            description: 'User to check red flags on',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'clear',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Clear all red flags from a user (Admin only)',
        options: [
          {
            name: 'user',
            description: 'User to clear all red flags from',
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
    const reason = interaction.options.getString('reason')

    // Only prevent self-flagging/unflagging/clearing, allow self-check
    if (user.id === interaction.user.id && subcommand !== 'check') {
      return interaction.followUp(mina.say('utility.redflag.error.noSelf'))
    }

    const response = await handleRedFlag(
      interaction,
      subcommand,
      user,
      reason,
      member
    )
    await interaction.followUp(response)
    return
  },
}

async function handleRedFlag(
  interaction: ChatInputCommandInteraction,
  action: string,
  user: User,
  reason: string | null,
  member: GuildMember
): Promise<string | { embeds: any[] }> {
  try {
    let userDb = await getUser(user)

    const isAdmin = member.permissions.has(PermissionFlagsBits.ModerateMembers)

    switch (action) {
      case 'add':
        if (!reason) return mina.say('utility.redflag.error.noReason')

        // Check if user already has a flag from this flagger
        if (
          userDb.flags?.some(flag => flag.flaggedBy === interaction.user.id)
        ) {
          return mina.say('utility.redflag.error.alreadyFlagged')
        }

        // Check if max flags reached
        if ((userDb.flags?.length || 0) >= MAX_FLAGS) {
          return mina.sayf('utility.redflag.error.maxReached', {
            max: MAX_FLAGS.toString(),
          })
        }

        await addFlag(
          user.id,
          reason,
          interaction.user.id,
          interaction.guild!.id,
          interaction.guild!.name
        )
        return mina.sayf('utility.redflag.success.added', {
          user: user.tag,
          reason,
        })

      case 'remove':
        if (!userDb.flags?.length)
          return mina.say('utility.redflag.error.noFlags')

        // Check if user has a flag from this person
        if (
          !userDb.flags.some(flag => flag.flaggedBy === interaction.user.id)
        ) {
          return mina.say('utility.redflag.error.notYourFlag')
        }

        await removeFlag(user.id, interaction.user.id)
        return mina.sayf('utility.redflag.success.removed', { user: user.tag })

      case 'clear':
        if (!isAdmin) return mina.say('permissions.missing')
        if (!userDb.flags?.length)
          return mina.say('utility.redflag.error.noFlags')

        await removeAllFlags(user.id)
        return mina.sayf('utility.redflag.success.cleared', { user: user.tag })

      case 'check':
        if (!userDb.flags?.length)
          return mina.say('utility.redflag.check.noFlags')

        const flagFields = await Promise.all(
          userDb.flags.map(async (flag, index) => {
            try {
              const flagger = await interaction.client.users.fetch(
                flag.flaggedBy
              )
              return {
                name: mina.sayf('utility.redflag.check.flagNumber', {
                  number: (index + 1).toString(),
                }),
                value: mina.sayf('utility.redflag.check.flagValue', {
                  by: flagger.tag,
                  server: flag.serverName,
                  when: Math.floor(flag.flaggedAt.getTime() / 1000).toString(),
                  reason: flag.reason,
                }),
                inline: false,
              }
            } catch (ex) {
              Logger.error('Failed to fetch flagger user', ex)
              return {
                name: mina.sayf('utility.redflag.check.flagNumber', {
                  number: (index + 1).toString(),
                }),
                value: mina.sayf('utility.redflag.check.flagValue', {
                  by: 'deleted user',
                  server: flag.serverName,
                  when: Math.floor(flag.flaggedAt.getTime() / 1000).toString(),
                  reason: flag.reason,
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

        const embed = MinaEmbed.warning()
          .setTitle(mina.say('utility.redflag.check.title'))
          .setDescription(description)
          .addFields(flagFields)
          .setColor(rating.color)
          .setFooter({
            text: mina.say('utility.redflag.check.footer'),
          })

        return { embeds: [embed] }

      default:
        return mina.say('error')
    }
  } catch (ex) {
    Logger.error('Red flag command', ex)
    return mina.say('utility.redflag.error.processing')
  }
}

export default command
