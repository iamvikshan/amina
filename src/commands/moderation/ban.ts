import { banTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  User,
} from 'discord.js'
import { MODERATION } from '@src/config'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'ban',
  description: 'bans the specified member',
  category: 'MODERATION',
  botPermissions: ['BanMembers'],
  userPermissions: ['BanMembers'],

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
        description: 'reason for ban',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!target) {
      await interaction.followUp('Please specify a valid user to ban.')
      return
    }

    const response = await ban(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
  },
}

async function ban(
  issuer: GuildMember,
  target: User,
  reason: string | null
): Promise<string> {
  const response = await banTarget(issuer, target, reason)
  if (typeof response === 'boolean') return `${target.username} is banned!`
  if (response === 'BOT_PERM')
    return `I do not have permission to ban ${target.username}`
  else if (response === 'MEMBER_PERM')
    return `You do not have permission to ban ${target.username}`
  else return `Failed to ban ${target.username}`
}

export default command
