import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { getAiConfig } from '@schemas/Dev'
import { EMBED_COLORS } from '@src/config'

export default async function configureHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const enabled = interaction.options.getBoolean('enabled', true)
  const globalConfig = await getAiConfig()

  if (enabled && !globalConfig.globallyEnabled) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        '❌ AI is currently disabled globally by the bot owner. Please try again later!'
      )
    return interaction.followUp({ embeds: [embed] })
  }

  await updateSettings(interaction.guild!.id, {
    aiResponder: {
      ...settings.aiResponder,
      enabled,
      updatedBy: interaction.user.id,
      updatedAt: new Date(),
    },
  })

  const embed = new EmbedBuilder()
    .setColor(enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
    .setDescription(
      `✨ AI has been **${enabled ? 'enabled' : 'disabled'}** for this server!`
    )

  await interaction.followUp({ embeds: [embed] })
  return
}
