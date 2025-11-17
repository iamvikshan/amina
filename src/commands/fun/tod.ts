import {
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  TextChannel,
} from 'discord.js'
import { getQuestions } from '@schemas/TruthOrDare'
import { getUser } from '@schemas/User'
import todHandler from '@handlers/tod'
import { EMBED_COLORS } from '@src/config'
import type { Command } from '@structures/Command'

// Helper function to create rating choices with Amina's style
const getRatingChoices = () => [
  { name: 'pg - keep it light and fun!', value: 'PG' },
  { name: 'pg-13 - getting interesting...', value: 'PG-13' },
  { name: 'pg-16 - spicy territory ahead', value: 'PG-16' },
  { name: 'r - strictly grown-ups only', value: 'R' },
]

// Helper function to create subcommand with rating option
const createSubcommandWithRating = (name: string, description: string) => ({
  name,
  description,
  type: ApplicationCommandOptionType.Subcommand,
  options: [
    {
      name: 'rating',
      description: 'how spicy do you want this to get?',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: getRatingChoices(),
    },
  ],
})

const command: Command = {
  name: 'tod',
  description: "ready for some truth or dare chaos? let's go!",
  category: 'FUN',
  slashCommand: {
    enabled: true,
    options: [
      createSubcommandWithRating('truth', 'time to spill some secrets!'),
      createSubcommandWithRating(
        'dare',
        "feeling brave? let's test your courage!"
      ),
      createSubcommandWithRating(
        'paranoia',
        "ooh, let's get into your head a bit"
      ),
      createSubcommandWithRating('nhie', 'never have i ever... or have i?'),
      createSubcommandWithRating('wyr', 'tough choices ahead, friend!'),
      createSubcommandWithRating('hye', "let's dig up some stories!"),
      createSubcommandWithRating(
        'wwyd',
        'what would you do in this wild scenario?'
      ),
      createSubcommandWithRating(
        'random',
        "feeling lucky? let's surprise you!"
      ),
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction | ButtonInteraction
  ) {
    if (interaction.isButton()) {
      return todHandler.handleTodButtonClick(interaction as ButtonInteraction)
    }

    const chatInteraction = interaction as ChatInputCommandInteraction
    const subcommand = chatInteraction.options.getSubcommand()
    const requestedRating = chatInteraction.options.getString('rating')
    const member = chatInteraction.member
    if (!member || !('user' in member)) {
      return chatInteraction.followUp('Could not find member information!')
    }
    const user = await getUser(member.user)
    // Check if age is set
    if (!user.profile?.age) {
      return chatInteraction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('✦ hold up friend!')
            .setDescription(
              'i need to know your age first! use `/profile set` so we can play safely!'
            ),
        ],
        ephemeral: true,
      })
    }
    // Check for R-rated content requirements
    if (requestedRating === 'R') {
      if (user.profile.age < 18) {
        return chatInteraction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.ERROR)
              .setTitle('✦ oops, age check failed!')
              .setDescription(
                'sorry friend, that stuff is for the grown-ups only!'
              ),
          ],
          ephemeral: true,
        })
      }

      const channel = chatInteraction.channel as TextChannel | null
      if (!channel?.nsfw) {
        return chatInteraction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.ERROR)
              .setTitle('✦ wrong place!')
              .setDescription(
                'psst! we need to be in an nsfw channel for that kind of fun!'
              ),
          ],
          ephemeral: true,
        })
      }
    }

    switch (subcommand) {
      case 'truth':
        sendQuestion(
          chatInteraction,
          'truth',
          user.profile.age,
          requestedRating
        )
        break
      case 'dare':
        sendQuestion(chatInteraction, 'dare', user.profile.age, requestedRating)
        break
      case 'paranoia':
        sendQuestion(
          chatInteraction,
          'paranoia',
          user.profile.age,
          requestedRating
        )
        break
      case 'nhie':
        sendQuestion(chatInteraction, 'nhie', user.profile.age, requestedRating)
        break
      case 'wyr':
        sendQuestion(chatInteraction, 'wyr', user.profile.age, requestedRating)
        break
      case 'hye':
        sendQuestion(chatInteraction, 'hye', user.profile.age, requestedRating)
        break
      case 'wwyd':
        sendQuestion(chatInteraction, 'wwyd', user.profile.age, requestedRating)
        break
      case 'random':
        sendRandomQuestion(chatInteraction, user.profile.age, requestedRating)
        break
    }
  },
}

async function sendQuestion(
  interaction: ChatInputCommandInteraction,
  category: string,
  userAge: number,
  requestedRating: string | null
) {
  const questions = await getQuestions(1, category, userAge, requestedRating)
  if (questions.length === 0) {
    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ oh no!')
          .setDescription(
            "i searched everywhere but couldn't find any questions matching what you wanted!"
          ),
      ],
    })
    return
  }

  const question = questions[0]
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle(`✦ ${category.toUpperCase()} TIME!`)
    .setDescription(
      category === 'truth'
        ? `${interaction.user.username}, don't you lie!\n\n**${question.question}**\n`
        : category === 'dare'
          ? `${interaction.user.username}, don't chicken out!\n\n**${question.question}**\n`
          : `${interaction.user.username}, don't be scared!\n\n**${question.question}**\n`
    )
    .setFooter({
      text: `type: ${category} | rating: ${question.rating} | qid: ${question.questionId} | player: ${interaction.user.tag}`,
    })

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('truthBtn')
      .setStyle(ButtonStyle.Primary)
      .setLabel('truth!'),
    new ButtonBuilder()
      .setCustomId('dareBtn')
      .setStyle(ButtonStyle.Success)
      .setLabel('dare!'),
    new ButtonBuilder()
      .setCustomId('randomBtn')
      .setStyle(ButtonStyle.Danger)
      .setLabel('surprise me!')
  )

  await interaction.followUp({
    embeds: [embed],
    components: [buttons],
  })
}

async function sendRandomQuestion(
  interaction: ChatInputCommandInteraction,
  userAge: number,
  requestedRating: string | null
) {
  const questions = await getQuestions(1, 'random', userAge, requestedRating)
  if (questions.length === 0) {
    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ oh no!')
          .setDescription(
            "i searched everywhere but couldn't find any questions matching what you wanted!"
          ),
      ],
      ephemeral: true,
    })
    return
  }

  const question = questions[0]
  const embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle('✦ RANDOM SURPRISE!')
    .setDescription(
      `ooh, this is gonna be fun! ready?\n\n**${question.question}**\n\nwhat's your next move?`
    )
    .setFooter({
      text: `type: ${question.category} | rating: ${question.rating} | qid: ${question.questionId} | player: ${interaction.user.tag}`,
    })

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('truthBtn')
      .setStyle(ButtonStyle.Primary)
      .setLabel('truth!'),
    new ButtonBuilder()
      .setCustomId('dareBtn')
      .setStyle(ButtonStyle.Success)
      .setLabel('dare!'),
    new ButtonBuilder()
      .setCustomId('randomBtn')
      .setStyle(ButtonStyle.Danger)
      .setLabel('surprise me!')
  )

  await interaction.followUp({ embeds: [embed], components: [buttons] })
}

export default command
