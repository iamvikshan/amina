import { kickTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MODERATION } from '@src/config'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'kick',
  description: 'Kicks the specified member',
  category: 'MODERATION',
  botPermissions: ['KickMembers'],
  userPermissions: ['KickMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'user',
        description: 'The target member',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for kick',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!user) {
      await interaction.followUp('Please specify a valid user to kick.')
      return
    }

    let target: GuildMember
    try {
      if (!interaction.guild) {
        await interaction.followUp('This command can only be used in a server.')
        return
      }
      target = await interaction.guild.members.fetch(user.id)
    } catch (_error) {
      await interaction.followUp('The specified user is not in this server.')
      return
    }

    const response = await kick(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
  },
}

async function kick(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string> {
  const response = await kickTarget(issuer, target, reason)
  if (typeof response === 'boolean') return `${target.user.username} is kicked!`
  if (response === 'BOT_PERM')
    return `I do not have permission to kick ${target.user.username}`
  else if (response === 'MEMBER_PERM')
    return `You do not have permission to kick ${target.user.username}`
  else return `Failed to kick ${target.user.username}`
}

export default command
