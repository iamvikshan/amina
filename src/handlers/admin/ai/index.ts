import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS, config } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { getAiConfig } from '@schemas/Dev'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show Mina AI Settings menu
 */
export async function showMinaAIMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild)
  const globalConfig = await getAiConfig()
  const aiConfig = settings.aiResponder || {
    enabled: false,
    mentionOnly: true,
    allowDMs: true,
  }

  const status = aiConfig.enabled ? '✅ Enabled' : '❌ Disabled'
  const globalStatus = globalConfig.globallyEnabled
    ? '✅ Enabled'
    : '❌ Disabled'
  const mode = aiConfig.mentionOnly ? '📢 Mention Only' : '🌊 Free Will'

  // Get free-will channels
  const allChannels = aiConfig.freeWillChannels || []

  const freeWillChannelList =
    allChannels.length > 0
      ? allChannels.map(id => `<#${id}>`).join(', ')
      : 'Not set'

  const isTestGuild = interaction.guild?.id === config.BOT.TEST_GUILD_ID
  const channelLimit = isTestGuild ? 'Unlimited' : 'Max 2'
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🤖 Mina AI Configuration')
    .setDescription(
      'Configure AI response behavior for your server.\n\n' +
        `**Server Status:** ${status}\n` +
        `**Global Status:** ${globalStatus}\n` +
        `**Mode:** ${mode}\n` +
        `**Free-Will Channels:** ${freeWillChannelList} ${isTestGuild ? '(Test Guild - Unlimited)' : `(${channelLimit})`}\n\n` +
        `💡 **Note:** DM support is now controlled by users via \`/mina-ai\` → Settings.`
    )
    .setFooter({ text: 'Select an action from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:minaai')
      .setPlaceholder('Choose an AI setting to configure')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle AI')
          .setDescription('Enable or disable AI for this server')
          .setValue('toggle')
          .setEmoji('🔄'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Free-Will Channel')
          .setDescription('Choose a channel for unrestricted AI chat')
          .setValue('freewill')
          .setEmoji('🌊'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle Mention-Only Mode')
          .setDescription('Require @mentions or allow all messages')
          .setValue('mentiononly')
          .setEmoji('📢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Manage Free-Will Channels')
          .setDescription('View and remove free-will channels')
          .setValue('manage_channels')
          .setEmoji('🗑️'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}

/**
 * Handle remove free-will channel selection
 */
export async function handleRemoveFreeWillChannel(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const channelId = interaction.values[0]
  const channel = interaction.guild?.channels.cache.get(channelId)

  if (!channel) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription('❌ **Channel Not Found**\n\nChannel no longer exists.')
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
    return
  }

  const settings = await getSettings(interaction.guild)
  const currentChannels = settings.aiResponder?.freeWillChannels || []

  if (!currentChannels.includes(channelId)) {
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
    return
  }

  const newChannels = currentChannels.filter(id => id !== channelId)

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
}

/**
 * Handle Mina AI action selection
 */
export async function handleMinaAIMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]

  await interaction.deferUpdate()
  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'toggle': {
      const newState = !settings.aiResponder?.enabled
      const globalConfig = await getAiConfig()

      if (newState && !globalConfig.globallyEnabled) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            '❌ AI is currently disabled globally by the bot owner. Please try again later!'
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
        return
      }

      await updateSettings(interaction.guild!.id, {
        aiResponder: {
          ...settings.aiResponder,
          enabled: newState,
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const embed = new EmbedBuilder()
        .setColor(newState ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
        .setDescription(
          `✨ AI has been **${newState ? 'enabled' : 'disabled'}** for this server!`
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
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setDescription(
          "🌊 **Select a channel for Free-Will AI chat**\n\nI'll respond to all messages in this channel without needing @mentions!"
        )

      const channelSelect =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('admin:channel:freewill')
            .setPlaceholder('Select a text channel')
            .setChannelTypes([
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ])
        )

      await interaction.editReply({
        embeds: [embed],
        components: [channelSelect],
      })
      break
    }
    case 'mentiononly': {
      const newState = !settings.aiResponder?.mentionOnly
      await updateSettings(interaction.guild!.id, {
        aiResponder: {
          ...settings.aiResponder,
          mentionOnly: newState,
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const embed = new EmbedBuilder()
        .setColor(newState ? EMBED_COLORS.WARNING : EMBED_COLORS.SUCCESS)
        .setDescription(
          newState
            ? "📢 Mention-only mode enabled! I'll only respond when @mentioned."
            : "🌊 Free-will mode enabled! I'll respond to all messages in the configured channel."
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
    case 'manage_channels': {
      // Get free-will channels
      const allChannels = settings.aiResponder?.freeWillChannels || []

      const isTestGuild = interaction.guild?.id === config.BOT.TEST_GUILD_ID
      const maxChannels = isTestGuild ? Infinity : 2
      const canAddMore = allChannels.length < maxChannels

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTitle('🌊 Manage Free-Will Channels')
        .setDescription(
          `**Current Channels:** ${allChannels.length > 0 ? allChannels.map(id => `<#${id}>`).join(', ') : 'None'}\n\n` +
            `Use the dropdowns below to add or remove channels.${!isTestGuild ? ` (Max ${maxChannels})` : ''}`
        )

      const components: ActionRowBuilder<any>[] = []

      // Add channel dropdown (only if we can add more)
      if (canAddMore) {
        const addChannelSelect =
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('admin:channel:add_freewill')
              .setPlaceholder('➕ Add a channel')
              .setChannelTypes([
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
              ])
          )
        components.push(addChannelSelect)
      }

      // Remove channel dropdown (only if we have channels) - use StringSelectMenu to show only configured channels
      if (allChannels.length > 0) {
        const removeChannelSelect =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('admin:menu:remove_freewill')
              .setPlaceholder('➖ Remove a channel')
              .addOptions(
                allChannels
                  .map(channelId => {
                    const channel =
                      interaction.guild?.channels.cache.get(channelId)
                    if (!channel) return null
                    return new StringSelectMenuOptionBuilder()
                      .setLabel(
                        channel.name.length > 100
                          ? channel.name.substring(0, 97) + '...'
                          : channel.name
                      )
                      .setDescription(
                        `Remove ${channel.name} from free-will channels`
                      )
                      .setValue(channelId)
                      .setEmoji('🗑️')
                  })
                  .filter(
                    (option): option is StringSelectMenuOptionBuilder =>
                      option !== null
                  )
              )
          )
        components.push(removeChannelSelect)
      }

      // Back button
      components.push(
        createSecondaryBtn({
          customId: 'admin:btn:back_minaai',
          label: 'Back to AI Menu',
          emoji: '◀️',
        })
      )

      await interaction.editReply({
        embeds: [embed],
        components,
      })
      break
    }
  }
}
