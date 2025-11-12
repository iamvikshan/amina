import { warnTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MODERATION } from '@src/config'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'warn',
  description: 'warns the specified member',
  category: 'MODERATION',
  userPermissions: ['KickMembers'],

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
        description: 'reason for warn',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!user) {
      await interaction.followUp('Please specify a valid user to warn.')
      return
    }

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a server.')
      return
    }

    const target = await interaction.guild.members.fetch(user.id)

    const response = await warn(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
  },
}

async function warn(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string> {
  const response = await warnTarget(issuer, target, reason)
  if (typeof response === 'boolean') return `${target.user.username} is warned!`
  if (response === 'BOT_PERM')
    return `I do not have permission to warn ${target.user.username}`
  else if (response === 'MEMBER_PERM')
    return `You do not have permission to warn ${target.user.username}`
  else return `Failed to warn ${target.user.username}`
}

export default command
