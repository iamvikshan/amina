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
  const questionIdInput = new TextInputBuilder({
    customId: 'question_id',
    label: 'question id',
    style: TextInputStyle.Short,
    placeholder: 't1, d2, nhie3, etc.',
    required: true,
    maxLength: 20,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    questionIdInput
  )

  const modal = new ModalBuilder({
    customId: 'dev:modal:tod_remove',
    title: 'remove truth or dare question',
    components: [firstRow],
  })

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
