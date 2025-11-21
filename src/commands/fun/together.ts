import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'

const discordTogether = [
  'askaway',
  'awkword',
  'betrayal',
  'bobble',
  'checkers',
  'chess',
  'chessdev',
  'doodlecrew',
  'fishing',
  'land',
  'lettertile',
  'meme',
  'ocho',
  'poker',
  'puttparty',
  'puttpartyqa',
  'sketchheads',
  'sketchyartist',
  'spellcast',
  'wordsnack',
  'youtube',
  'youtubedev',
]

const command: CommandData = {
  name: 'together',
  description: "let's start an adventure together in a voice channel!",
  category: 'FUN',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'type',
        description: 'pick your flavor of fun - what shall we play?',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: discordTogether.map(game => ({ name: game, value: game })),
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('type')
    if (!choice) {
      return interaction.followUp('Please select a game type!')
    }
    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp('Could not find member information!')
    }
    const response = await getTogetherInvite(member, choice)
    await interaction.followUp(response)
    return
  },
}

async function getTogetherInvite(
  member: GuildMember,
  choice: string | null
): Promise<{ embeds: EmbedBuilder[] }> {
  if (!choice) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ oops!')
          .setDescription('Please provide a valid game type!'),
      ],
    }
  }

  choice = choice.toLowerCase()

  if (!member.voice.channel?.id) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ oops, slight problem!')
          .setDescription(
            "hey friend! looks like you need to hop into a voice channel first - i can't start the fun without knowing where to set it up!"
          ),
      ],
    }
  }

  if (!discordTogether.includes(choice)) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle("✦ hmm, that's not quite right")
          .setDescription(
            `oh! that game isn't in my collection yet. here's what we can play:\n\n${discordTogether.join(', ')}`
          ),
      ],
    }
  }

  const invite = await (
    member.client as any
  ).discordTogether.createTogetherCode(member.voice.channel.id, choice)

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle(`✦ time for ${choice}!`)
        .setDescription(
          `quick, quick! [click here](${invite.code}) to jump into the fun! i've got everything set up and ready to go!`
        ),
    ],
  }
}

export default command
