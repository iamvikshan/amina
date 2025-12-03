import { ChatInputCommandInteraction } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { getAiConfig } from '@schemas/Dev'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function configureHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const enabled = interaction.options.getBoolean('enabled', true)
  const globalConfig = await getAiConfig()

  if (enabled && !globalConfig.globallyEnabled) {
    const embed = MinaEmbed.error().setDescription(
      'ai is currently disabled globally by the bot owner. please try again later!'
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

  const embed = enabled ? MinaEmbed.success() : MinaEmbed.warning()
  embed.setDescription(
    `ai has been **${enabled ? 'enabled' : 'disabled'}** for this server!`
  )

  await interaction.followUp({ embeds: [embed] })
  return
}
