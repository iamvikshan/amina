import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { getAiConfig } from '@schemas/Dev'
import { EMBED_COLORS } from '@src/config'

export default async function statusHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const globalConfig = await getAiConfig()
  const aiConfig = settings.aiResponder || {}

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🤖 Amina AI Status - ' + interaction.guild?.name)
    .addFields(
      {
        name: '⚡ Server Status',
        value: aiConfig.enabled ? '✅ Enabled' : '❌ Disabled',
        inline: true,
      },
      {
        name: '🌐 Global Status',
        value: globalConfig.globallyEnabled ? '✅ Enabled' : '❌ Disabled',
        inline: true,
      },
      {
        name: '💬 Mode',
        value: aiConfig.mentionOnly ? '📢 Mention Only' : '🌊 Free Will',
        inline: true,
      },
      {
        name: '📍 Free-Will Channel',
        value: aiConfig.freeWillChannelId
          ? `<#${aiConfig.freeWillChannelId}>`
          : 'Not set',
        inline: true,
      },
      {
        name: '📬 DM Support',
        value: aiConfig.allowDMs ? '✅ Enabled' : '❌ Disabled',
        inline: true,
      },
      {
        name: '📅 Last Updated',
        value: aiConfig.updatedAt
          ? `<t:${Math.floor(aiConfig.updatedAt.getTime() / 1000)}:R>`
          : 'Never',
        inline: true,
      }
    )

  if (!globalConfig.globallyEnabled) {
    embed.setFooter({
      text: '⚠️ AI is globally disabled by the bot owner',
    })
  }

  await interaction.followUp({ embeds: [embed] })
}
