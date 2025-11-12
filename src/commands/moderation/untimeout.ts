import { unTimeoutTarget } from '@helpers/ModUtils'
import { MODERATION } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'untimeout',
  description: 'remove timeout from a member',
  category: 'MODERATION',
  botPermissions: ['ModerateMembers'],
  userPermissions: ['ModerateMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'user',
        description: 'the target member',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'reason for timeout',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!user) {
      await interaction.followUp(
        'Please specify a valid user to remove timeout from.'
      )
      return
    }

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a server.')
      return
    }

    const target = await interaction.guild.members.fetch(user.id)

    const response = await untimeout(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
  },
}

async function untimeout(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string> {
  const response = await unTimeoutTarget(issuer, target, reason)
  if (typeof response === 'boolean')
    return `Timeout of ${target.user.username} is removed!`
  if (response === 'BOT_PERM')
    return `I do not have permission to remove timeout of ${target.user.username}`
  else if (response === 'MEMBER_PERM')
    return `You do not have permission to remove timeout of ${target.user.username}`
  else if (response === 'NO_TIMEOUT')
    return `${target.user.username} is not timed out!`
  else return `Failed to remove timeout of ${target.user.username}`
}

export default command
