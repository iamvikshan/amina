import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS, config } from '@src/config'
import type { BotClient } from '@src/structures'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show reload menu
 */
export async function showReloadMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🔄 Command Reload')
    .setDescription(
      'Reload commands, events, or contexts! 🔄\n\n' +
        '**Select what to reload:**\n' +
        '📝 **Commands** - Reload all slash commands\n' +
        '📡 **Events** - Reload all event handlers\n' +
        '🎯 **Contexts** - Reload all context menus\n' +
        '🌐 **All** - Reload everything\n\n' +
        '⚠️ **Note:** This will reload the specified modules from disk.'
    )
    .setFooter({ text: 'Select what to reload' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:reload_type')
      .setPlaceholder('Select what to reload...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Commands')
          .setDescription('Reload all slash commands')
          .setValue('commands')
          .setEmoji('📝'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Events')
          .setDescription('Reload all event handlers')
          .setValue('events')
          .setEmoji('📡'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Contexts')
          .setDescription('Reload all context menus')
          .setValue('contexts')
          .setEmoji('🎯'),
        new StringSelectMenuOptionBuilder()
          .setLabel('All')
          .setDescription('Reload everything')
          .setValue('all')
          .setEmoji('🌐')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_reload',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle reload type selection
 */
export async function handleReloadType(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const reloadType = interaction.values[0]

  await interaction.deferUpdate()

  const client = interaction.client as BotClient

  // Helper to register commands to test guild
  const registerCommands = async () => {
    const testGuild = client.guilds.cache.get(
      config.BOT.TEST_GUILD_ID as string
    )
    if (testGuild) {
      // We only reload to test guild to avoid global rate limits
      const devConfig = await import('@schemas/Dev').then(m =>
        m.getDevCommandsConfig()
      )

      const commandsToSet = client.slashCommands
        .filter(
          cmd =>
            cmd.testGuildOnly ||
            (cmd.devOnly && devConfig.ENABLED) ||
            (client.config.INTERACTIONS.GLOBAL &&
              !cmd.testGuildOnly &&
              !cmd.devOnly)
        )
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: 1, // ApplicationCommandType.ChatInput
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false,
        }))

      await testGuild.commands.set(commandsToSet)
    }
  }

  try {
    switch (reloadType.toLowerCase()) {
      case 'commands':
        client.loadCommands('src/commands')
        await registerCommands()
        break
      case 'events':
        client.loadEvents('src/events')
        break
      case 'contexts':
        client.loadContexts('src/contexts')
        await registerCommands()
        break
      case 'all':
        client.loadCommands('src/commands')
        client.loadContexts('src/contexts')
        client.loadEvents('src/events')
        await registerCommands()
        break
      default:
        await interaction.followUp({
          content: '❌ Invalid reload type selected',
          ephemeral: true,
        })
        return
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle('✅ Reloaded')
      .setDescription(`Successfully reloaded ${reloadType}`)

    await interaction.editReply({
      embeds: [embed],
      components: [
        createSecondaryBtn({
          customId: 'dev:btn:back_reload',
          label: 'Back to Dev Hub',
          emoji: '◀️',
        }),
      ],
    })
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle('❌ Reload Failed')
      .setDescription(`Failed to reload ${reloadType}: ${error.message}`)

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [
        createSecondaryBtn({
          customId: 'dev:btn:back_reload',
          label: 'Back to Dev Hub',
          emoji: '◀️',
        }),
      ],
    })
  }
}
