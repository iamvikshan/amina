import { ButtonInteraction } from 'discord.js'
import { getQuestions } from '@schemas/TruthOrDare'
import { getUser } from '@schemas/User'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

async function handleTodButtonClick(
  interaction: ButtonInteraction
): Promise<any> {
  if (!interaction.member || !interaction.guild) return

  const user = (await getUser((interaction.member as any).user)) as any
  const userAge = user.profile?.age || null

  // Get the current rating from the footer of the previous embed
  const currentEmbed = interaction.message.embeds[0]
  const footerText = currentEmbed.data.footer?.text || ''
  const ratingMatch = footerText.match(/rating: ([^|]+)/i)
  const currentRating = ratingMatch ? ratingMatch[1].trim() : 'PG' // default to PG if no match

  // Check PG-16 requirement
  if (currentRating === 'PG-16' && userAge && userAge < 16) {
    return interaction.reply({
      embeds: [
        MinaEmbed.error()
          .setTitle(mina.say('tod.ageCheck.title'))
          .setDescription(mina.say('tod.ageCheck.underage16')),
      ],
      ephemeral: true,
    })
  }

  // Check R-rating requirements for button clicks
  if (currentRating === 'R') {
    if (!userAge || userAge < 18) {
      return interaction.reply({
        embeds: [
          MinaEmbed.error()
            .setTitle(mina.say('tod.ageCheck.title'))
            .setDescription(
              userAge
                ? mina.say('tod.ageCheck.underage18')
                : mina.say('tod.ageCheck.unknown')
            ),
        ],
        ephemeral: true,
      })
    }

    if (!(interaction.channel as any)?.nsfw) {
      return interaction.reply({
        embeds: [
          MinaEmbed.error()
            .setTitle(mina.say('tod.wrongPlace.title'))
            .setDescription(mina.say('tod.wrongPlace.description')),
        ],
        ephemeral: true,
      })
    }
  }

  const customId = interaction.customId

  switch (customId) {
    case 'truthBtn':
      await sendQuestion(interaction, 'truth', userAge, currentRating)
      break
    case 'dareBtn':
      await sendQuestion(interaction, 'dare', userAge, currentRating)
      break
    case 'randomBtn':
      await sendRandomQuestion(interaction, userAge, currentRating)
      break
  }
}

async function sendQuestion(
  interaction: ButtonInteraction,
  category: string,
  userAge: number | null,
  effectiveRating: string
): Promise<any> {
  const questions = (await getQuestions(
    1,
    category,
    userAge,
    effectiveRating
  )) as any[]
  if (questions.length === 0) {
    return interaction.reply({
      embeds: [
        MinaEmbed.error()
          .setTitle(mina.say('tod.noQuestions.title'))
          .setDescription(mina.say('tod.noQuestions.description')),
      ],
      ephemeral: true,
    })
  }

  const question = questions[0]
  // Display rating: use effective rating, or 'PG' for null/legacy questions
  const displayRating = question.rating || 'PG'

  let titleKey = 'tod.embed.truth.title'
  let descKey = 'tod.embed.truth.description'
  if (category === 'dare') {
    titleKey = 'tod.embed.dare.title'
    descKey = 'tod.embed.dare.description'
  } else if (category === 'random') {
    titleKey = 'tod.embed.random.title'
    descKey = 'tod.embed.random.description'
  }

  const embed = MinaEmbed.primary()
    .setTitle(mina.say(titleKey))
    .setDescription(
      mina.sayf(descKey, {
        user: interaction.user.username,
        question: question.question,
      })
    )
    .setFooter({
      text: mina.sayf('tod.footer', {
        type: category,
        rating: displayRating,
        id: question.questionId,
        user: interaction.user.tag,
      }),
    })

  const buttons = MinaRows.from(
    MinaButtons.custom('truthBtn', 'truth!', 1),
    MinaButtons.custom('dareBtn', 'dare!', 3),
    MinaButtons.custom('randomBtn', 'surprise me!', 4)
  )

  await interaction.reply({
    embeds: [embed],
    components: [buttons],
  })
}

async function sendRandomQuestion(
  interaction: ButtonInteraction,
  userAge: number | null,
  effectiveRating: string
): Promise<any> {
  const questions = (await getQuestions(
    1,
    'random',
    userAge,
    effectiveRating
  )) as any[]
  if (questions.length === 0) {
    return interaction.reply({
      embeds: [
        MinaEmbed.error()
          .setTitle(mina.say('tod.noQuestions.title'))
          .setDescription(mina.say('tod.noQuestions.description')),
      ],
      ephemeral: true,
    })
  }

  const question = questions[0]
  // Display rating: use effective rating, or 'PG' for null/legacy questions
  const displayRating = question.rating || 'PG'
  const embed = MinaEmbed.primary()
    .setTitle(mina.say('tod.embed.random.title'))
    .setDescription(
      mina.sayf('tod.embed.random.description', {
        question: question.question,
      })
    )
    .setFooter({
      text: mina.sayf('tod.footer', {
        type: question.category,
        rating: displayRating,
        id: question.questionId,
        user: interaction.user.tag,
      }),
    })

  const buttons = MinaRows.from(
    MinaButtons.custom('truthBtn', 'truth!', 1),
    MinaButtons.custom('dareBtn', 'dare!', 3),
    MinaButtons.custom('randomBtn', 'surprise me!', 4)
  )

  await interaction.reply({ embeds: [embed], components: [buttons] })
}

export default {
  handleTodButtonClick,
}
