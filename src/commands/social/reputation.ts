import { getUser } from '@schemas/User'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { diffHours, getRemainingTime } from '@helpers/Utils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'rep',
  description: 'give reputation to a user',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'view',
        description: 'view reputation for a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to check reputation for',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'give',
        description: 'give reputation to a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to check reputation for',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    let response: string | { embeds: MinaEmbed[] } = 'Invalid subcommand'

    // status
    if (sub === 'view') {
      const target = interaction.options.getUser('user') || interaction.user
      response = await viewReputation(target)
    }

    // give
    if (sub === 'give') {
      const target = interaction.options.getUser('user')
      if (!target) {
        return interaction.followUp(
          'Please specify a user to give reputation to.'
        )
      }
      response = await giveReputation(interaction.user, target)
    }

    return interaction.followUp(response)
  },
}

async function viewReputation(target: User) {
  const userData = await getUser(target)
  if (!userData) return `${target.username} has no reputation yet`

  const embed = MinaEmbed.primary()
    .setAuthor({ name: `reputation for ${target.username}` })
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      {
        name: 'given',
        value: (userData.reputation?.given || 0).toString(),
        inline: true,
      },
      {
        name: 'received',
        value: (userData.reputation?.received || 0).toString(),
        inline: true,
      }
    )

  return { embeds: [embed] }
}

async function giveReputation(user: User, target: User) {
  if (target.bot) return 'You cannot give reputation to bots'
  if (target.id === user.id) return 'You cannot give reputation to yourself'

  const userData = await getUser(user)
  if (!userData) {
    return 'Failed to fetch user data. Please try again.'
  }

  if (!userData.reputation) {
    userData.reputation = {
      received: 0,
      given: 0,
      timestamp: undefined,
    }
  }

  if (userData.reputation.timestamp) {
    const lastRep = new Date(userData.reputation.timestamp)
    const diff = diffHours(new Date(), lastRep)
    if (diff < 24) {
      const nextUsage = new Date(lastRep.setHours(lastRep.getHours() + 24))
      return `You can again run this command in \`${getRemainingTime(nextUsage)}\``
    }
  }

  const targetData = await getUser(target)
  if (!targetData) {
    return 'Failed to fetch target user data. Please try again.'
  }

  if (!targetData.reputation) {
    targetData.reputation = {
      received: 0,
      given: 0,
      timestamp: undefined,
    }
  }

  userData.reputation.given += 1
  userData.reputation.timestamp = new Date()
  targetData.reputation.received += 1

  await userData.save()
  await targetData.save()

  const embed = MinaEmbed.primary()
    .setDescription(`${target.toString()} +1 rep!`)
    .setFooter({ text: `by ${user.username}` })
    .setTimestamp(Date.now())

  return { embeds: [embed] }
}

export default command
