import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'

const command: CommandData = {
  name: 'counter',
  description: 'create a channel that auto-updates with member or bot counts',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  botPermissions: ['ManageChannels'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'type',
        description: 'what to count: users, members, or bots',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          {
            name: 'Users',
            value: 'USERS',
          },
          {
            name: 'Members',
            value: 'MEMBERS',
          },
          {
            name: 'Bots',
            value: 'BOTS',
          },
        ],
      },
      {
        name: 'name',
        description: 'prefix text for the counter channel',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, data: any) {
    const type = interaction.options.getString('type', true)
    const name = interaction.options.getString('name', true)

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a guild!')
      return
    }

    const response = await setupCounter(
      interaction.guild,
      type.toUpperCase(),
      name,
      data.settings
    )
    return interaction.followUp(response)
  },
}

async function setupCounter(
  guild: Guild,
  type: string,
  name: string,
  settings: any
): Promise<string> {
  let channelName = name

  const stats = await (guild as any).fetchMemberStats()
  if (type === 'USERS') channelName += ` : ${stats[0]} 👥`
  else if (type === 'MEMBERS') channelName += ` : ${stats[2]}`
  else if (type === 'BOTS') channelName += ` : ${stats[1]} 🤖`

  const vc = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: ['Connect'],
      },
      {
        id: guild.members.me?.id as string,
        allow: ['ViewChannel', 'ManageChannels', 'Connect'],
      },
    ],
  })

  const exists = settings.counters.find(
    (v: any) => v.counter_type.toUpperCase() === type
  )
  if (exists) {
    exists.name = name
    exists.channel_id = vc.id
  } else {
    settings.counters.push({
      counter_type: type,
      channel_id: vc.id,
      name,
    })
  }

  settings.server.bots = stats[1]
  await settings.save()

  return `configuration saved! counter channel \`${channelName}\` created successfully!`
}

export default command
