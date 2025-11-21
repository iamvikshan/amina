import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'

const command: CommandData = {
  name: 'maxwarn',
  description: 'Set max warnings configuration!',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'limit',
        description:
          'Set max warnings a member can receive before taking action! ⚠️',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'amount',
            description: 'Max number of strikes!',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'action',
        description: 'Set action to perform after receiving maximum warnings!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'action',
            description: 'Action to perform',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: 'TIMEOUT',
                value: 'TIMEOUT',
              },
              {
                name: 'KICK',
                value: 'KICK',
              },
              {
                name: 'BAN',
                value: 'BAN',
              },
            ],
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, data: any) {
    const sub = interaction.options.getSubcommand()

    let response: string
    if (sub === 'limit') {
      response = await setLimit(
        interaction.options.getInteger('amount', true),
        data.settings
      )
    } else if (sub === 'action') {
      if (!interaction.guild) {
        await interaction.followUp('This command can only be used in a guild!')
        return
      }
      response = await setAction(
        interaction.guild,
        interaction.options.getString('action', true),
        data.settings
      )
    } else {
      response = 'Invalid subcommand!'
    }

    await interaction.followUp(response)
  },
}

async function setLimit(limit: number, settings: any): Promise<string> {
  settings.max_warn.limit = limit
  await settings.save()
  return `Yay! 🎊 Configuration saved! Maximum warnings are set to ${limit}! 🌈`
}

async function setAction(
  guild: Guild,
  action: string,
  settings: any
): Promise<string> {
  if (action === 'TIMEOUT') {
    if (!guild.members.me?.permissions.has('ModerateMembers')) {
      return "Oh no! I don't have permission to timeout members! Please grant me that permission!"
    }
  }

  if (action === 'KICK') {
    if (!guild.members.me?.permissions.has('KickMembers')) {
      return "Eep! I don't have permission to kick members! Please grant me that permission!"
    }
  }

  if (action === 'BAN') {
    if (!guild.members.me?.permissions.has('BanMembers')) {
      return "Yikes! I don't have permission to ban members! Please grant me that permission!"
    }
  }

  settings.max_warn.action = action
  await settings.save()
  return `Yay! Configuration saved! Automod action is set to ${action}!`
}

export default command
