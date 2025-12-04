import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js'
import { addQuestion } from '@schemas/TruthOrDare'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show modal for adding a ToD question
 */
export async function showAddTodModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const categoryInput = new TextInputBuilder({
    customId: 'category',
    label: 'category',
    style: TextInputStyle.Short,
    placeholder: 'truth, dare, paranoia, nhie, wyr, hye, wwyd',
    required: true,
    maxLength: 20,
  })

  const questionInput = new TextInputBuilder({
    customId: 'question',
    label: 'question',
    style: TextInputStyle.Paragraph,
    placeholder: 'enter the question text...',
    required: true,
    maxLength: 500,
  })

  const ratingInput = new TextInputBuilder({
    customId: 'rating',
    label: 'rating (pg, pg-13, pg-16, r)',
    style: TextInputStyle.Short,
    placeholder: 'pg',
    required: true,
    maxLength: 10,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    categoryInput
  )
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    questionInput
  )
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    ratingInput
  )

  const modal = new ModalBuilder({
    customId: 'dev:modal:tod_add',
    title: 'add truth or dare question',
    components: [firstRow, secondRow, thirdRow],
  })

  await interaction.showModal(modal)
}

/**
 * Handle ToD add modal submission
 */
export async function handleAddTodModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true })

  const category = interaction.fields.getTextInputValue('category')
  const question = interaction.fields.getTextInputValue('question')
  const rating = interaction.fields.getTextInputValue('rating').toUpperCase()

  // Validate rating
  const validRatings = ['PG', 'PG-13', 'PG-16', 'R']
  if (!validRatings.includes(rating)) {
    await interaction.editReply({
      content: `❌ Invalid rating. Must be one of: ${validRatings.join(', ')}`,
    })
    return
  }

  try {
    await addQuestion(category.toLowerCase(), question, rating)

    const embed = MinaEmbed.success(
      `yay! your new *${category}* question has been added: "${question}" [${rating}]! so fun, right?`
    )

    await interaction.editReply({ embeds: [embed] })
  } catch (error: any) {
    const errorEmbed = MinaEmbed.error(
      `failed to add question: ${error.message}`
    )

    await interaction.editReply({ embeds: [errorEmbed] })
  }
}
