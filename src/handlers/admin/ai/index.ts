import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { config } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { getAiConfig } from '@schemas/Dev'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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

  const status = aiConfig.enabled ? 'enabled' : 'disabled'
  const globalStatus = globalConfig.globallyEnabled ? 'enabled' : 'disabled'
  const mode = aiConfig.mentionOnly ? 'mention only' : 'free will'

  // Get free-will channels
  const allChannels = aiConfig.freeWillChannels || []

  const freeWillChannelList =
    allChannels.length > 0
      ? allChannels.map(id => `<#${id}>`).join(', ')
      : 'Not set'

  const isTestGuild = interaction.guild?.id === config.BOT.TEST_GUILD_ID
  const channelLimit = isTestGuild ? 'Unlimited' : 'Max 2'
  const embed = MinaEmbed.primary()
    .setTitle('mina ai configuration')
    .setDescription(
      'configure ai response behavior for your server.\n\n' +
        `**server status:** ${status}\n` +
        `**global status:** ${globalStatus}\n` +
        `**mode:** ${mode}\n` +
        `**free-will channels:** ${freeWillChannelList} ${isTestGuild ? '(test guild - unlimited)' : `(${channelLimit})`}\n\n` +
        `note: dm support is now controlled by users via \`/mina-ai\` -> settings.`
    )
    .setFooter({ text: 'select an action from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:minaai')
      .setPlaceholder('choose an ai setting to configure')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle ai')
          .setDescription('enable or disable ai for this server')
          .setValue('toggle'),
        new StringSelectMenuOptionBuilder()
          .setLabel('set free-will channel')
          .setDescription('choose a channel for unrestricted ai chat')
          .setValue('freewill'),
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle mention-only mode')
          .setDescription('require @mentions or allow all messages')
          .setValue('mentiononly'),
        new StringSelectMenuOptionBuilder()
          .setLabel('manage free-will channels')
          .setDescription('view and remove free-will channels')
          .setValue('manage_channels'),
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
    const embed = MinaEmbed.error('channel no longer exists')
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('admin:btn:back_minaai')],
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const currentChannels = settings.aiResponder?.freeWillChannels || []

  if (!currentChannels.includes(channelId)) {
    const embed = MinaEmbed.error(
      `${channel} is not in your free-will channels list`
    )
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('admin:btn:back_minaai')],
    })
    return
  }

  const newChannels = currentChannels.filter(id => id !== channelId)
  const guildId = interaction.guild?.id
  if (!guildId) return

  await updateSettings(guildId, {
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
    components: [MinaRows.backRow('admin:btn:back_minaai')],
  })
}

/**
 * Handle Mina AI action selection
 */
export async function handleMinaAIMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]
  const guildId = interaction.guild?.id
  if (!guildId) return

  await interaction.deferUpdate()
  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'toggle': {
      const newState = !settings.aiResponder?.enabled
      const globalConfig = await getAiConfig()

      if (newState && !globalConfig.globallyEnabled) {
        const embed = MinaEmbed.error(
          'ai is currently disabled globally by the bot owner... please try again later!'
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRows.backRow('admin:btn:back_minaai')],
        })
        return
      }

      await updateSettings(guildId, {
        aiResponder: {
          ...settings.aiResponder,
          enabled: newState,
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const embed = newState
        ? MinaEmbed.success(`ai has been enabled for this server!`)
        : MinaEmbed.warning(`ai has been disabled for this server`)
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRows.backRow('admin:btn:back_minaai')],
      })
      break
    }
    case 'freewill': {
      const embed = MinaEmbed.primary().setDescription(
        "select a channel for free-will ai chat... i'll respond to all messages there without needing @mentions!"
      )

      const channelSelect =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('admin:channel:freewill')
            .setPlaceholder('select a text channel')
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
      await updateSettings(guildId, {
        aiResponder: {
          ...settings.aiResponder,
          mentionOnly: newState,
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const embed = newState
        ? MinaEmbed.warning(
            "mention-only mode enabled! i'll only respond when @mentioned"
          )
        : MinaEmbed.success(
            "free-will mode enabled! i'll respond to all messages in the configured channel"
          )
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRows.backRow('admin:btn:back_minaai')],
      })
      break
    }
    case 'manage_channels': {
      // Get free-will channels
      const allChannels = settings.aiResponder?.freeWillChannels || []

      const isTestGuild = interaction.guild?.id === config.BOT.TEST_GUILD_ID
      const maxChannels = isTestGuild ? Infinity : 2
      const canAddMore = allChannels.length < maxChannels

      const embed = MinaEmbed.primary()
        .setTitle('manage free-will channels')
        .setDescription(
          `**current channels:** ${allChannels.length > 0 ? allChannels.map(id => `<#${id}>`).join(', ') : 'none'}\n\n` +
            `use the dropdowns below to add or remove channels${!isTestGuild ? ` (max ${maxChannels})` : ''}`
        )

      const components: ActionRowBuilder<any>[] = []

      // Add channel dropdown (only if we can add more)
      if (canAddMore) {
        const addChannelSelect =
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId('admin:channel:add_freewill')
              .setPlaceholder('add a channel')
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
              .setPlaceholder('remove a channel')
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
                        `remove ${channel.name} from free-will channels`
                      )
                      .setValue(channelId)
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
      components.push(MinaRows.backRow('admin:btn:back_minaai'))

      await interaction.editReply({
        embeds: [embed],
        components,
      })
      break
    }
  }
}
