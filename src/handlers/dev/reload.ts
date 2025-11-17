import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import type { BotClient } from '@src/structures'
import { createSecondaryBtn, createSuccessBtn } from '@helpers/componentHelper'
import { registerAutocomplete } from '@handlers/autocomplete'
import type { AutocompleteInteraction } from 'discord.js'

/**
 * Register autocomplete for reload command
 */
export function registerReloadAutocomplete(): void {
  registerAutocomplete(
    'dev',
    'command',
    async (interaction: AutocompleteInteraction) => {
      const client = interaction.client as BotClient
      const focused = interaction.options.getFocused().toLowerCase()

      // Get all commands and contexts
      const allItems: Array<{ name: string; type: string }> = []

      // Add commands
      client.slashCommands.forEach((cmd: any) => {
        allItems.push({ name: cmd.name, type: 'command' })
      })

      // Add contexts
      client.contextMenus.forEach((ctx: any) => {
        allItems.push({ name: ctx.name, type: 'context' })
      })

      // Filter by focused value
      const filtered = allItems
        .filter(item => item.name.toLowerCase().includes(focused))
        .slice(0, 25) // Discord limit

      await interaction.respond(
        filtered.map(item => ({
          name: `${item.name} (${item.type})`,
          value: item.name,
        }))
      )
    }
  )
}

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

  try {
    switch (reloadType.toLowerCase()) {
      case 'commands':
        client.loadCommands('src/commands')
        break
      case 'events':
        client.loadEvents('src/events')
        break
      case 'contexts':
        client.loadContexts('src/contexts')
        break
      case 'all':
        client.loadCommands('src/commands')
        client.loadContexts('src/contexts')
        client.loadEvents('src/events')
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
