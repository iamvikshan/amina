import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { updateSettings } from '@schemas/Guild'
import { EMBED_COLORS, config } from '@src/config'

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
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        `❌ **Limit Reached!**\n\n` +
          `You can only have up to 2 free-will channels. Current channels:\n` +
          newChannels.map(id => `<#${id}>`).join(', ') +
          `\n\nRemove a channel first to add a new one.`
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
  const embed = new EmbedBuilder()
    .setColor(action === 'added' ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
    .setDescription(
      action === 'added'
        ? `🌊 **Free-will channel added!**\n\n` +
            `Added ${channel} to free-will channels.\n` +
            `Current channels: ${channelList}\n\n` +
            `I'll respond to all messages in these channels without needing @mentions! ✨`
        : `🌊 **Free-will channel removed!**\n\n` +
            `Removed ${channel} from free-will channels.\n` +
            `Current channels: ${channelList || 'None'}`
    )

  await interaction.followUp({ embeds: [embed] })
}
