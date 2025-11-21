import { ChannelSelectMenuInteraction, EmbedBuilder } from 'discord.js'
import { EMBED_COLORS, config } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { createSecondaryBtn } from '@helpers/componentHelper'
import updateChannel from '@commands/admin/settings/updateChannel'
import setChannel from '@commands/admin/logs/setChannel'

/**
 * Check if guild is test guild
 */
function isTestGuild(guildId: string | null): boolean {
  if (!guildId) return false
  return guildId === config.BOT.TEST_GUILD_ID
}

/**
 * Get free-will channels from settings
 */
function getFreeWillChannels(settings: any): string[] {
  if (!settings?.aiResponder) return []
  return settings.aiResponder.freeWillChannels || []
}

/**
 * Add or remove a free-will channel
 * Returns new array of channels
 */
function toggleFreeWillChannel(
  currentChannels: string[],
  channelId: string,
  guildId: string
): { channels: string[]; action: 'added' | 'removed' | 'limit_reached' } {
  const isTest = isTestGuild(guildId)
  const maxChannels = isTest ? Infinity : 2

  if (currentChannels.includes(channelId)) {
    // Remove channel
    return {
      channels: currentChannels.filter(id => id !== channelId),
      action: 'removed',
    }
  }

  // Add channel (check limit for regular guilds)
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

/**
 * Handle channel selection for updates channel, freewill, and log channel
 */
export async function handleChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  const [, , action] = interaction.customId.split(':')
  const channel = interaction.channels.first()

  if (!channel) {
    await interaction.reply({
      content: '❌ No channel selected',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'updateschannel':
      await updateChannel(interaction as any, channel as any, settings)
      break
    case 'add_freewill': {
      const currentChannels = getFreeWillChannels(settings)
      const isTest = isTestGuild(interaction.guild!.id)
      const maxChannels = isTest ? Infinity : 2

      if (currentChannels.includes(channel.id)) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.WARNING)
          .setDescription(
            `⚠️ **Already Added**\n\n` +
              `${channel} is already in your free-will channels list.`
          )
        await interaction.editReply({
          embeds: [embed],
          components: [
            createSecondaryBtn({
              customId: 'admin:btn:back_minaai',
              label: 'Back to AI Menu',
              emoji: '◀️',
            }),
          ],
        })
        break
      }

      if (!isTest && currentChannels.length >= maxChannels) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            `❌ **Limit Reached!**\n\n` +
              `You can only have up to ${maxChannels} free-will channels. Current channels:\n` +
              currentChannels.map(id => `<#${id}>`).join(', ') +
              `\n\nRemove a channel first to add a new one.`
          )
        await interaction.editReply({
          embeds: [embed],
          components: [
            createSecondaryBtn({
              customId: 'admin:btn:back_minaai',
              label: 'Back to AI Menu',
              emoji: '◀️',
            }),
          ],
        })
        break
      }

      const newChannels = [...currentChannels, channel.id]

      await updateSettings(interaction.guild!.id, {
        aiResponder: {
          ...settings.aiResponder,
          freeWillChannels: newChannels,
          mentionOnly: false, // Auto-disable mention-only when adding
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const channelList = newChannels.map(id => `<#${id}>`).join(', ')
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setDescription(
          `➕ **Channel Added!**\n\n` +
            `Added ${channel} to free-will channels.\n` +
            `**Current channels:** ${channelList}\n\n` +
            `I'll respond to all messages in these channels without needing @mentions! ✨`
        )
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back_minaai',
            label: 'Back to AI Menu',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
    case 'remove_freewill': {
      const currentChannels = getFreeWillChannels(settings)

      if (!currentChannels.includes(channel.id)) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            `❌ **Channel Not Found**\n\n` +
              `${channel} is not in your free-will channels list.`
          )
        await interaction.editReply({
          embeds: [embed],
          components: [
            createSecondaryBtn({
              customId: 'admin:btn:back_minaai',
              label: 'Back to AI Menu',
              emoji: '◀️',
            }),
          ],
        })
        break
      }

      const newChannels = currentChannels.filter(id => id !== channel.id)

      await updateSettings(interaction.guild!.id, {
        aiResponder: {
          ...settings.aiResponder,
          freeWillChannels: newChannels,
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const channelList =
        newChannels.length > 0
          ? newChannels.map(id => `<#${id}>`).join(', ')
          : 'None'

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setDescription(
          `🗑️ **Channel Removed!**\n\n` +
            `Removed ${channel} from free-will channels.\n` +
            `**Remaining channels:** ${channelList}`
        )
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back_minaai',
            label: 'Back to AI Menu',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
    case 'freewill': {
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
        await interaction.editReply({
          embeds: [embed],
          components: [
            createSecondaryBtn({
              customId: 'admin:btn:back_minaai',
              label: 'Back to AI Menu',
              emoji: '◀️',
            }),
          ],
        })
        break
      }

      await updateSettings(interaction.guild!.id, {
        aiResponder: {
          ...settings.aiResponder,
          freeWillChannels: newChannels,
          mentionOnly:
            action === 'added' ? false : settings.aiResponder?.mentionOnly, // Auto-disable mention-only when adding
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const channelList = newChannels.map(id => `<#${id}>`).join(', ')
      const embed = new EmbedBuilder()
        .setColor(
          action === 'added' ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING
        )
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
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back_minaai',
            label: 'Back to AI Menu',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
    case 'logchannel': {
      const result = await setChannel(channel as any, settings)
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setDescription(result)
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back',
            label: 'Back to Admin Hub',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
  }
}
