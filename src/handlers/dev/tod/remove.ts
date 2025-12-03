import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js'
import { deleteQuestion } from '@schemas/TruthOrDare'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show modal for removing a ToD question
 */
export async function showRemoveTodModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:tod_remove')
    .setTitle('Remove Truth or Dare Question')

  const questionIdInput = new TextInputBuilder()
    .setCustomId('question_id')
    .setLabel('Question ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('T1, D2, NHIE3, etc.')
    .setRequired(true)
    .setMaxLength(20)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    questionIdInput
  )

  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
 * Handle ToD remove modal submission
 */
export async function handleRemoveTodModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true })

  const questionId = interaction.fields
    .getTextInputValue('question_id')
    .toUpperCase()

  try {
    const deletedQuestion = await deleteQuestion(questionId)

    const embed = MinaEmbed.success(
      `question deleted successfully!\n` +
        `**id**: \`${deletedQuestion.questionId}\`\n` +
        `**category**: ${deletedQuestion.category}\n` +
        `**question**: "${deletedQuestion.question}"\n` +
        `**rating**: ${deletedQuestion.rating}`
    )

    await interaction.editReply({ embeds: [embed] })
  } catch (error: any) {
    const errorEmbed = MinaEmbed.error(error.message)

    await interaction.editReply({ embeds: [errorEmbed] })
  }
}
