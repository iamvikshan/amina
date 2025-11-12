import { addQuestion, deleteQuestion } from '@schemas/TruthOrDare'
import type { ChatInputCommandInteraction } from 'discord.js'

export async function addTod(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const category = interaction.options.getString('category', true)
  const question = interaction.options.getString('question', true)
  const rating = interaction.options.getString('rating', true)

  const response = await addQuestion(category, question, rating)
  await interaction.followUp({
    content: `Yay! 🎉 Your new *${category}* question has been added: "${question}" [${rating}]! So fun, right? 😄`,
    embeds: [response as any],
  })
}

export async function delTod(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const questionId = interaction.options
    .getString('question_id', true)
    .toUpperCase()

  try {
    const deletedQuestion = await deleteQuestion(questionId)
    await interaction.followUp({
      content: `Question deleted successfully! 🗑️\n**ID**: \`${deletedQuestion.questionId}\`\n**Category**: ${deletedQuestion.category}\n**Question**: "${deletedQuestion.question}"\n**Rating**: ${deletedQuestion.rating}`,
      ephemeral: true,
    })
  } catch (error: any) {
    await interaction.followUp({
      content: `❌ ${error.message}`,
      ephemeral: true,
    })
  }
}

export default 0
