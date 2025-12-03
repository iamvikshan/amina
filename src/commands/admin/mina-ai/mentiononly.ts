import { ChatInputCommandInteraction } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function mentionOnlyHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const enabled = interaction.options.getBoolean('enabled', true)

  await updateSettings(interaction.guild!.id, {
    aiResponder: {
      ...settings.aiResponder,
      mentionOnly: enabled,
      updatedBy: interaction.user.id,
      updatedAt: new Date(),
    },
  })

  const embed = enabled ? MinaEmbed.warning() : MinaEmbed.success()
  embed.setDescription(
    enabled
      ? "mention-only mode enabled! i'll only respond when @mentioned."
      : "free-will mode enabled! i'll respond to all messages in the configured channel."
  )

  await interaction.followUp({ embeds: [embed] })
}
