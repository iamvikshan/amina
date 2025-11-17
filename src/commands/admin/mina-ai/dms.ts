import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { EMBED_COLORS } from '@src/config'

export default async function dmsHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const enabled = interaction.options.getBoolean('enabled', true)

  await updateSettings(interaction.guild!.id, {
    aiResponder: {
      ...settings.aiResponder,
      allowDMs: enabled,
      updatedBy: interaction.user.id,
      updatedAt: new Date(),
    },
  })

  const embed = new EmbedBuilder()
    .setColor(enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
    .setDescription(
      `📬 DM support **${enabled ? 'enabled' : 'disabled'}** for server members!`
    )

  await interaction.followUp({ embeds: [embed] })
}
