import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ButtonInteraction,
  TextChannel,
} from 'discord.js'
import { getQuestions } from '@schemas/TruthOrDare'
import { getUser } from '@schemas/User'
import todHandler from '@handlers/tod'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'

// Helper function to create rating choices with Amina's style
// Ratings: PG (default, 13+), PG-16 (16+), R (18+ NSFW only)
const getRatingChoices = () => [
  { name: 'pg - keep it fun! (default)', value: 'PG' },
  { name: 'pg-16 - spicy territory ahead (16+)', value: 'PG-16' },
  { name: 'r - strictly grown-ups only (18+ nsfw)', value: 'R' },
]

// Helper function to create subcommand with rating option
const createSubcommandWithRating = (name: string, description: string) => ({
  name,
  description,
  type: ApplicationCommandOptionType.Subcommand as const,
  options: [
    {
      name: 'rating',
      description: 'how spicy do you want this to get?',
      type: ApplicationCommandOptionType.String as const,
      required: false,
      choices: getRatingChoices(),
    },
  ],
})

const command: CommandData = {
  name: 'tod',
  description: 'play truth, dare, never have i ever, and more party games',
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
      return chatInteraction.followUp({
        embeds: [MinaEmbed.error(mina.say('fun.tod.error.memberNotFound'))],
      })
    }
    const user = (await getUser(member.user)) as any
    const userAge = user.profile?.age || null

    // Determine the rating to use
    // Priority: requested > user preference > PG default
    let effectiveRating = requestedRating || user.todRating || 'PG'

    // Check for PG-16 age requirement
    if (effectiveRating === 'PG-16' && userAge && userAge < 16) {
      effectiveRating = 'PG' // Downgrade if underage
    }

    // Check for R-rated content requirements
    if (effectiveRating === 'R') {
      if (!userAge || userAge < 18) {
        return chatInteraction.followUp({
          embeds: [
            MinaEmbed.error()
              .setTitle(mina.say('fun.tod.ageCheck.title'))
              .setDescription(
                userAge
                  ? mina.say('fun.tod.ageCheck.underage')
                  : mina.say('fun.tod.ageCheck.unknown')
              ),
          ],
          ephemeral: true,
        })
      }

      const channel = chatInteraction.channel as TextChannel | null
      if (!channel?.nsfw) {
        return chatInteraction.followUp({
          embeds: [
            MinaEmbed.error()
              .setTitle(mina.say('fun.tod.wrongPlace.title'))
              .setDescription(mina.say('fun.tod.wrongPlace.description')),
          ],
          ephemeral: true,
        })
      }
    }

    // Save user's rating preference if they explicitly selected one
    if (requestedRating && requestedRating !== user.todRating) {
      user.todRating = requestedRating
      await user.save()
    }

    switch (subcommand) {
      case 'truth':
        sendQuestion(chatInteraction, 'truth', userAge, effectiveRating)
        break
      case 'dare':
        sendQuestion(chatInteraction, 'dare', userAge, effectiveRating)
        break
      case 'paranoia':
        sendQuestion(chatInteraction, 'paranoia', userAge, effectiveRating)
        break
      case 'nhie':
        sendQuestion(chatInteraction, 'nhie', userAge, effectiveRating)
        break
      case 'wyr':
        sendQuestion(chatInteraction, 'wyr', userAge, effectiveRating)
        break
      case 'hye':
        sendQuestion(chatInteraction, 'hye', userAge, effectiveRating)
        break
      case 'wwyd':
        sendQuestion(chatInteraction, 'wwyd', userAge, effectiveRating)
        break
      case 'random':
        sendRandomQuestion(chatInteraction, userAge, effectiveRating)
        break
    }
  },
}

async function sendQuestion(
  interaction: ChatInputCommandInteraction,
  category: string,
  userAge: number | null,
  effectiveRating: string
) {
  const questions = await getQuestions(1, category, userAge, effectiveRating)
  if (questions.length === 0) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error()
          .setTitle(mina.say('fun.tod.noQuestions.title'))
          .setDescription(mina.say('fun.tod.noQuestions.description')),
      ],
    })
    return
  }

  const question = questions[0]
  // Display rating: use effective rating, or 'PG' for null/legacy questions
  const displayRating = question.rating || 'PG'
  const embed = MinaEmbed.primary()
    .setTitle(mina.say(`fun.tod.embed.${category}.title`))
    .setDescription(
      mina.sayf(`fun.tod.embed.${category}.description`, {
        user: interaction.user.username,
        question: question.question,
      })
    )
    .setFooter({
      text: mina.sayf('fun.tod.footer', {
        type: category,
        rating: displayRating,
        id: question.questionId,
        user: interaction.user.tag,
      }),
    })

  const buttons = MinaRows.from(
    MinaButtons.truth('truthBtn').setLabel(mina.say('fun.tod.buttons.truth')),
    MinaButtons.dare('dareBtn').setLabel(mina.say('fun.tod.buttons.dare')),
    MinaButtons.random('randomBtn').setLabel(mina.say('fun.tod.buttons.random'))
  )

  await interaction.followUp({
    embeds: [embed],
    components: [buttons],
  })
}

async function sendRandomQuestion(
  interaction: ChatInputCommandInteraction,
  userAge: number | null,
  effectiveRating: string
) {
  const questions = await getQuestions(1, 'random', userAge, effectiveRating)
  if (questions.length === 0) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error()
          .setTitle(mina.say('fun.tod.noQuestions.title'))
          .setDescription(mina.say('fun.tod.noQuestions.description')),
      ],
      ephemeral: true,
    })
    return
  }

  const question = questions[0]
  // Display rating: use effective rating, or 'PG' for null/legacy questions
  const displayRating = question.rating || 'PG'
  const embed = MinaEmbed.primary()
    .setTitle(mina.say('fun.tod.embed.random.title'))
    .setDescription(
      mina.sayf('fun.tod.embed.random.description', {
        question: question.question,
      })
    )
    .setFooter({
      text: mina.sayf('fun.tod.footer', {
        type: question.category,
        rating: displayRating,
        id: question.questionId,
        user: interaction.user.tag,
      }),
    })

  const buttons = MinaRows.from(
    MinaButtons.truth('truthBtn').setLabel(mina.say('fun.tod.buttons.truth')),
    MinaButtons.dare('dareBtn').setLabel(mina.say('fun.tod.buttons.dare')),
    MinaButtons.random('randomBtn').setLabel(mina.say('fun.tod.buttons.random'))
  )

  await interaction.followUp({ embeds: [embed], components: [buttons] })
}

export default command
