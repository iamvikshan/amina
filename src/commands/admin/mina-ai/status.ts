import { ChatInputCommandInteraction } from 'discord.js'
import { getAiConfig } from '@schemas/Dev'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function statusHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const globalConfig = await getAiConfig()
  const aiConfig = settings.aiResponder || {}

  const embed = MinaEmbed.primary()
    .setTitle('amina ai status - ' + interaction.guild?.name)
    .addFields(
      {
        name: 'server status',
        value: aiConfig.enabled ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'global status',
        value: globalConfig.globallyEnabled ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'mode',
        value: aiConfig.mentionOnly ? 'mention only' : 'free will',
        inline: true,
      },
      {
        name: 'free-will channels',
        value: (() => {
          const channels = aiConfig.freeWillChannels || []
          return channels.length > 0
            ? channels.map((id: string) => `<#${id}>`).join(', ')
            : 'not set'
        })(),
        inline: true,
      },
      {
        name: 'dm support',
        value: aiConfig.allowDMs ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'last updated',
        value: aiConfig.updatedAt
          ? `<t:${Math.floor(aiConfig.updatedAt.getTime() / 1000)}:R>`
          : 'never',
        inline: true,
      }
    )

  if (!globalConfig.globallyEnabled) {
    embed.setFooter({
      text: 'ai is globally disabled by the bot owner',
    })
  }

  await interaction.followUp({ embeds: [embed] })
}
