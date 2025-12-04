import {
  ChannelSelectMenuInteraction,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js'
import { config } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { MinaRow } from '@helpers/componentHelper'
import updateChannel from '@commands/admin/settings/updateChannel'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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
      content: 'no channel selected',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  if (!interaction.guild) {
    await interaction.editReply({
      content: 'This command can only be used in a guild.',
      embeds: [],
      components: [],
    })
    return
  }

  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'updateschannel':
      await updateChannel(interaction as any, channel as any, settings)
      break
    case 'add_freewill': {
      const currentChannels = getFreeWillChannels(settings)
      const isTest = isTestGuild(interaction.guild.id)
      const maxChannels = isTest ? Infinity : 2

      if (currentChannels.includes(channel.id)) {
        const embed = MinaEmbed.warning(
          `${channel} is already in your free-will channels list`
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRow.backRow('admin:btn:back_minaai')],
        })
        break
      }

      if (!isTest && currentChannels.length >= maxChannels) {
        const embed = MinaEmbed.error(
          `you can only have up to ${maxChannels} free-will channels\n` +
            `current channels: ${currentChannels.map(id => `<#${id}>`).join(', ')}\n\n` +
            `remove a channel first to add a new one`
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRow.backRow('admin:btn:back_minaai')],
        })
        break
      }

      const newChannels = [...currentChannels, channel.id]

      await updateSettings(interaction.guild.id, {
        aiResponder: {
          ...settings.aiResponder,
          freeWillChannels: newChannels,
          mentionOnly: false, // Auto-disable mention-only when adding
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const channelList = newChannels.map(id => `<#${id}>`).join(', ')
      const embed = MinaEmbed.success(
        `added ${channel} to free-will channels\n` +
          `**current channels:** ${channelList}\n\n` +
          `i'll respond to all messages in these channels without needing @mentions!`
      )
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRow.backRow('admin:btn:back_minaai')],
      })
      break
    }
    case 'remove_freewill': {
      const currentChannels = getFreeWillChannels(settings)

      if (!currentChannels.includes(channel.id)) {
        const embed = MinaEmbed.error(
          `${channel} is not in your free-will channels list`
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRow.backRow('admin:btn:back_minaai')],
        })
        break
      }

      const newChannels = currentChannels.filter(id => id !== channel.id)

      await updateSettings(interaction.guild.id, {
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

      const embed = MinaEmbed.success(
        `removed ${channel} from free-will channels\n` +
          `**remaining channels:** ${channelList}`
      )
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRow.backRow('admin:btn:back_minaai')],
      })
      break
    }
    case 'freewill': {
      const currentChannels = getFreeWillChannels(settings)
      const { channels: newChannels, action } = toggleFreeWillChannel(
        currentChannels,
        channel.id,
        interaction.guild.id
      )

      if (action === 'limit_reached') {
        const embed = MinaEmbed.error(
          `you can only have up to 2 free-will channels\n` +
            `current channels: ${newChannels.map(id => `<#${id}>`).join(', ')}\n\n` +
            `remove a channel first to add a new one`
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRow.backRow('admin:btn:back_minaai')],
        })
        break
      }

      await updateSettings(interaction.guild.id, {
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
      const embed =
        action === 'added'
          ? MinaEmbed.success(
              `added ${channel} to free-will channels\n` +
                `current channels: ${channelList}\n\n` +
                `i'll respond to all messages in these channels without needing @mentions!`
            )
          : MinaEmbed.warning(
              `removed ${channel} from free-will channels\n` +
                `current channels: ${channelList || 'none'}`
            )
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRow.backRow('admin:btn:back_minaai')],
      })
      break
    }
    case 'logchannel': {
      const textChannel = channel as TextChannel

      // Check bot permissions
      const botMember = interaction.guild.members.me
      if (
        !botMember ||
        !textChannel
          .permissionsFor(botMember)
          ?.has([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
          ])
      ) {
        const embed = MinaEmbed.error(
          `i don't have permission to send messages and embeds in ${textChannel}. please give me those permissions.`
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRow.backRow('admin:btn:back')],
        })
        break
      }

      // Initialize logs configuration if not already set
      if (!settings.logs) {
        settings.logs = {
          enabled: true,
          member: {
            message_edit: true,
            message_delete: true,
            role_changes: true,
          },
          channel: {
            create: true,
            edit: true,
            delete: true,
          },
          role: {
            create: true,
            edit: true,
            delete: true,
          },
        }
      }

      settings.logs_channel = textChannel.id
      await settings.save()

      const embed = MinaEmbed.success(
        `log channel has been set to ${textChannel}`
      )
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRow.backRow('admin:btn:back')],
      })
      break
    }
  }
}
