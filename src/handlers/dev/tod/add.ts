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
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:tod_add')
    .setTitle('Add Truth or Dare Question')

  const categoryInput = new TextInputBuilder()
    .setCustomId('category')
    .setLabel('Category')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('truth, dare, paranoia, nhie, wyr, hye, wwyd')
    .setRequired(true)
    .setMaxLength(20)

  const questionInput = new TextInputBuilder()
    .setCustomId('question')
    .setLabel('Question')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter the question text...')
    .setRequired(true)
    .setMaxLength(500)

  const ratingInput = new TextInputBuilder()
    .setCustomId('rating')
    .setLabel('Rating (PG, PG-13, PG-16, R)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('PG')
    .setRequired(true)
    .setMaxLength(10)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    categoryInput
  )
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    questionInput
  )
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    ratingInput
  )

  modal.addComponents([firstRow, secondRow, thirdRow])

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
