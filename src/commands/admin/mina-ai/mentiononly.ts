import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { EMBED_COLORS } from '@src/config'

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

  const embed = new EmbedBuilder()
    .setColor(enabled ? EMBED_COLORS.WARNING : EMBED_COLORS.SUCCESS)
    .setDescription(
      enabled
        ? "📢 Mention-only mode enabled! I'll only respond when @mentioned."
        : "🌊 Free-will mode enabled! I'll respond to all messages in the configured channel."
    )

  await interaction.followUp({ embeds: [embed] })
}
