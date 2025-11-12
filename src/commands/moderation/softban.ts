import { softbanTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MODERATION } from '@src/config'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'softban',
  description: 'softban the specified member. Kicks and deletes messages',
  category: 'MODERATION',
  botPermissions: ['BanMembers'],
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
        description: 'reason for softban',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!user) {
      await interaction.followUp('Please specify a valid user to softban.')
      return
    }

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a server.')
      return
    }

    let target: GuildMember
    try {
      target = await interaction.guild.members.fetch(user.id)
    } catch (_error) {
      await interaction.followUp('The specified user is not in this server.')
      return
    }

    const response = await softban(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
  },
}

async function softban(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string> {
  const response = await softbanTarget(issuer, target, reason)
  if (typeof response === 'boolean')
    return `${target.user.username} is soft-banned!`
  if (response === 'BOT_PERM')
    return `I do not have permission to softban ${target.user.username}`
  else if (response === 'MEMBER_PERM')
    return `You do not have permission to softban ${target.user.username}`
  else return `Failed to softban ${target.user.username}`
}

export default command
