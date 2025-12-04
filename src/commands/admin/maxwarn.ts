import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'maxwarn',
  description: 'set warning threshold and automatic punishment action',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'limit',
        description: 'set maximum warnings before punishment',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'amount',
            description: 'number of warnings allowed',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'action',
        description: 'set punishment when limit is reached',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'action',
            description: 'timeout, kick, or ban',
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
        await interaction.followUp(mina.say('serverOnly'))
        return
      }
      response = await setAction(
        interaction.guild,
        interaction.options.getString('action', true),
        data.settings
      )
    } else {
      response = mina.say('error.invalidSubcommand')
    }

    await interaction.followUp(response)
  },
}

async function setLimit(limit: number, settings: any): Promise<string> {
  settings.max_warn.limit = limit
  await settings.save()
  return `configuration saved! maximum warnings are set to ${limit}!`
}

async function setAction(
  guild: Guild,
  action: string,
  settings: any
): Promise<string> {
  const actionLower = action.toLowerCase()

  if (action === 'TIMEOUT') {
    if (!guild.members.me?.permissions.has('ModerateMembers')) {
      return mina.sayf('moderation.maxwarn.missingPermission', {
        action: actionLower,
      })
    }
  }

  if (action === 'KICK') {
    if (!guild.members.me?.permissions.has('KickMembers')) {
      return mina.sayf('moderation.maxwarn.missingPermission', {
        action: actionLower,
      })
    }
  }

  if (action === 'BAN') {
    if (!guild.members.me?.permissions.has('BanMembers')) {
      return mina.sayf('moderation.maxwarn.missingPermission', {
        action: actionLower,
      })
    }
  }

  settings.max_warn.action = action
  await settings.save()
  return mina.sayf('moderation.maxwarn.actionSet', { action: actionLower })
}

export default command
