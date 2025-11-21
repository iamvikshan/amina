import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { getWarningLogs, clearWarningLogs } from '@schemas/ModLog'
import { getMember } from '@schemas/Member'
import { MODERATION } from '@src/config'

const command: CommandData = {
  name: 'warnings',
  description: 'list or clear user warnings',
  category: 'MODERATION',
  userPermissions: ['KickMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'list',
        description: 'list all warnings for a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the target member',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'clear',
        description: 'clear all warnings for a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the target member',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    let response: any = ''

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a server.')
      return
    }

    if (sub === 'list') {
      const user = interaction.options.getUser('user')
      if (!user) {
        await interaction.followUp('Please specify a valid user.')
        return
      }
      const target =
        (await interaction.guild.members.fetch(user.id)) ||
        (interaction.member as GuildMember)
      response = await listWarnings(target, interaction)
    } else if (sub === 'clear') {
      const user = interaction.options.getUser('user')
      if (!user) {
        await interaction.followUp('Please specify a valid user.')
        return
      }
      const target = await interaction.guild.members.fetch(user.id)
      response = await clearWarnings(target, interaction)
    } else {
      response = `Invalid subcommand ${sub}`
    }

    await interaction.followUp(response)
    return
  },
}

async function listWarnings(
  target: GuildMember,
  interaction: ChatInputCommandInteraction
) {
  if (!target) return 'No user provided'
  if (target.user.bot) return "Bots don't have warnings"

  const warnings = await getWarningLogs(
    interaction.guildId as string,
    target.id
  )
  if (!warnings.length) return `${target.user.username} has no warnings`

  const acc = warnings
    .map(
      (warning, i) =>
        `${i + 1}. ${warning.reason} [By ${warning.admin.username}]`
    )
    .join('\n')
  const embed = new EmbedBuilder({
    author: { name: `${target.user.username}'s warnings` },
    description: acc,
  })

  return { embeds: [embed] }
}

async function clearWarnings(
  target: GuildMember,
  interaction: ChatInputCommandInteraction
) {
  if (!target) return 'No user provided'
  if (target.user.bot) return "Bots don't have warnings"

  const memberDb = await getMember(interaction.guildId as string, target.id)
  ;(memberDb as any).warnings = 0
  await (memberDb as any).save()

  await clearWarningLogs(interaction.guildId as string, target.id)
  return `${target.user.username}'s warnings have been cleared`
}

export default command
