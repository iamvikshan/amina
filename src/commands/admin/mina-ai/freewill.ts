import { ChatInputCommandInteraction } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { config } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

function isTestGuild(guildId: string | null): boolean {
  if (!guildId) return false
  return guildId === config.BOT.TEST_GUILD_ID
}

function getFreeWillChannels(settings: any): string[] {
  if (!settings?.aiResponder) return []
  return settings.aiResponder.freeWillChannels || []
}

function toggleFreeWillChannel(
  currentChannels: string[],
  channelId: string,
  guildId: string
): { channels: string[]; action: 'added' | 'removed' | 'limit_reached' } {
  const isTest = isTestGuild(guildId)
  const maxChannels = isTest ? Infinity : 2

  if (currentChannels.includes(channelId)) {
    return {
      channels: currentChannels.filter(id => id !== channelId),
      action: 'removed',
    }
  }

  if (!isTest && currentChannels.length >= maxChannels) {
    return {
      channels: currentChannels,
      action: 'limit_reached',
    }
  }

  return {
    channels: [...currentChannels, channelId],
    action: 'added',
  }
}

export default async function freewillHandler(
  interaction: ChatInputCommandInteraction,
  settings: any
) {
  const channel = interaction.options.getChannel('channel', true)
  const currentChannels = getFreeWillChannels(settings)
  const { channels: newChannels, action } = toggleFreeWillChannel(
    currentChannels,
    channel.id,
    interaction.guild!.id
  )

  if (action === 'limit_reached') {
    const embed = MinaEmbed.error().setDescription(
      `**limit reached!**\n\n` +
        `you can only have up to 2 free-will channels. current channels:\n` +
        newChannels.map(id => `<#${id}>`).join(', ') +
        `\n\nremove a channel first to add a new one.`
    )
    await interaction.followUp({ embeds: [embed] })
    return
  }

  await updateSettings(interaction.guild!.id, {
    aiResponder: {
      ...settings.aiResponder,
      freeWillChannels: newChannels,
      mentionOnly:
        action === 'added' ? false : settings.aiResponder?.mentionOnly,
      updatedBy: interaction.user.id,
      updatedAt: new Date(),
    },
  })

  const channelList = newChannels.map(id => `<#${id}>`).join(', ')
  const embed = action === 'added' ? MinaEmbed.success() : MinaEmbed.warning()
  embed.setDescription(
    action === 'added'
      ? `**free-will channel added!**\n\n` +
          `added ${channel} to free-will channels.\n` +
          `current channels: ${channelList}\n\n` +
          `i'll respond to all messages in these channels without needing @mentions!`
      : `**free-will channel removed!**\n\n` +
          `removed ${channel} from free-will channels.\n` +
          `current channels: ${channelList || 'none'}`
  )

  await interaction.followUp({ embeds: [embed] })
}
