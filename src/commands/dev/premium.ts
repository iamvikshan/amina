import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { getUser, updatePremium } from '@schemas/User'

const command: CommandData = {
  name: 'premium',
  description: 'grant or revoke premium access for users',
  cooldown: 5,
  category: 'DEV',
  devOnly: true,
  slashCommand: {
    enabled: false,
    ephemeral: true,
    options: [
      {
        name: 'add',
        description: 'grant premium status to a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to give premium to',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'duration',
            description: 'days of premium to grant',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'remove',
        description: 'revoke premium status from a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'user to remove premium from',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    const targetUser = interaction.options.getUser('user', true)

    let userDb = await getUser(targetUser)

    if (!userDb) {
      userDb = await (getUser as any).addUser(targetUser)
    }

    if (subcommand === 'add') {
      const duration = interaction.options.getInteger('duration', true)

      if (duration <= 0) {
        return interaction.followUp(
          "you can't add negative or zero days... try a positive number?"
        )
      }

      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + duration)

      await updatePremium(targetUser.id, true, expirationDate)

      return interaction.followUp(
        `${targetUser.tag} now has premium until <t:${Math.floor(expirationDate.getTime() / 1000)}:F>. that's ${duration} days of premium access!`
      )
    } else if (subcommand === 'remove') {
      if (!(userDb as any).premium.enabled) {
        return interaction.followUp(
          `${targetUser.tag} doesn't have premium status. can't remove what's not there.`
        )
      }

      await updatePremium(targetUser.id, false, null)

      return interaction.followUp(
        `${targetUser.tag}'s premium status has been removed.`
      )
    }

    return interaction.followUp('Invalid subcommand')
  },
}

export default command
