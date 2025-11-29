import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from 'discord.js'
import { getQuestions } from '@schemas/TruthOrDare'
import { getUser } from '@schemas/User'
import { EMBED_COLORS } from '../config'

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
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ age check!')
          .setDescription('that content needs you to be 16+, friend!'),
      ],
      ephemeral: true,
    })
  }

  // Check R-rating requirements for button clicks
  if (currentRating === 'R') {
    if (!userAge || userAge < 18) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('✦ oops, age check needed!')
            .setDescription(
              userAge
                ? 'sorry friend, that content is for the grown-ups only!'
                : 'i need to know your age for R-rated content! use `/profile hub` to set it.'
            ),
        ],
        ephemeral: true,
      })
    }

    if (!(interaction.channel as any)?.nsfw) {
      return interaction.reply({
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
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ oh no!')
          .setDescription(
            "i searched everywhere but couldn't find any questions matching what you wanted!"
          ),
      ],
      ephemeral: true,
    })
  }

  const question = questions[0]
  // Display rating: use effective rating, or 'PG' for null/legacy questions
  const displayRating = question.rating || 'PG'
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
      text: `type: ${category} | rating: ${displayRating} | qid: ${question.questionId} | player: ${interaction.user.tag}`,
    })

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('✦ oh no!')
          .setDescription(
            "i searched everywhere but couldn't find any questions matching what you wanted!"
          ),
      ],
      ephemeral: true,
    })
  }

  const question = questions[0]
  // Display rating: use effective rating, or 'PG' for null/legacy questions
  const displayRating = question.rating || 'PG'
  const embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle('✦ RANDOM SURPRISE!')
    .setDescription(
      `ooh, this is gonna be fun! ready?\n\n**${question.question}**\n\nwhat's your next move?`
    )
    .setFooter({
      text: `type: ${question.category} | rating: ${displayRating} | qid: ${question.questionId} | player: ${interaction.user.tag}`,
    })

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

  await interaction.reply({ embeds: [embed], components: [buttons] })
}

export default {
  handleTodButtonClick,
}
