import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { getAiConfig } from '@schemas/Dev'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { handleAdminBackButton } from '../main-hub'

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
    freeWillChannelId: null,
    allowDMs: true,
  }

  const status = aiConfig.enabled ? '✅ Enabled' : '❌ Disabled'
  const globalStatus = globalConfig.globallyEnabled
    ? '✅ Enabled'
    : '❌ Disabled'
  const mode = aiConfig.mentionOnly ? '📢 Mention Only' : '🌊 Free Will'
  const freeWillChannel = aiConfig.freeWillChannelId
    ? `<#${aiConfig.freeWillChannelId}>`
    : 'Not set'
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🤖 Mina AI Configuration')
    .setDescription(
      'Configure AI response behavior for your server.\n\n' +
        `**Server Status:** ${status}\n` +
        `**Global Status:** ${globalStatus}\n` +
        `**Mode:** ${mode}\n` +
        `**Free-Will Channel:** ${freeWillChannel}\n\n` +
        `💡 **Note:** DM support is now controlled by users via \`/mina-ai\` → Settings. Only developers can disable DMs globally.`
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
          .setLabel('Back to Main Menu')
          .setDescription('Return to admin hub')
          .setValue('back')
          .setEmoji('◀️'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}

/**
 * Handle Mina AI action selection
 */
export async function handleMinaAIMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]

  if (action === 'back') {
    await interaction.deferUpdate()
    await handleAdminBackButton(interaction as any)
    return
  }

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
              customId: 'admin:btn:back',
              label: 'Back to Admin Hub',
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
            customId: 'admin:btn:back',
            label: 'Back to Admin Hub',
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
