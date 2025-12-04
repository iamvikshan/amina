import { ChatInputCommandInteraction } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function dmsHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const enabled = interaction.options.getBoolean('enabled', true)

  const guild = interaction.guild
  if (!guild) {
    const errorEmbed = MinaEmbed.error().setDescription(
      'This command must be used in a server (guild).'
    )
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true })
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
    }
    return
  }
  await updateSettings(guild.id, {
    aiResponder: {
      ...settings.aiResponder,
      allowDMs: enabled,
      updatedBy: interaction.user.id,
      updatedAt: new Date(),
    },
  })

  const embed = enabled ? MinaEmbed.success() : MinaEmbed.warning()
  embed.setDescription(
    `dm support **${enabled ? 'enabled' : 'disabled'}** for server members!`
  )

  await interaction.followUp({ embeds: [embed] })
}
