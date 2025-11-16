import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { EMBED_COLORS } from '@src/config'

export default async function freewillHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const channel = interaction.options.getChannel('channel', true)

  await updateSettings(interaction.guild!.id, {
    aiResponder: {
      ...settings.aiResponder,
      freeWillChannelId: channel.id,
      mentionOnly: false, // Auto-enable free-will mode
      updatedBy: interaction.user.id,
      updatedAt: new Date(),
    },
  })

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `🌊 Free-will channel set to ${channel}!\n\n` +
        `I'll respond to all messages there without needing @mentions! ✨`
    )

  await interaction.followUp({ embeds: [embed] })
}
