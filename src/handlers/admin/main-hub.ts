import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings } from '@schemas/Guild'
import { showServerSettingsMenu } from './settings'
import { showMinaAIMenu } from './ai'
import { showLoggingMenu } from './logging'
import { showStatusEmbed } from './settings/embeds'

/**
 * Handle admin category selection from main hub
 */
export async function handleAdminCategoryMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const category = interaction.values[0]

  await interaction.deferUpdate()

  switch (category) {
    case 'settings':
      await showServerSettingsMenu(interaction)
      break
    case 'minaai':
      await showMinaAIMenu(interaction)
      break
    case 'logs':
      await showLoggingMenu(interaction)
      break
    case 'status':
      const settings = await getSettings(interaction.guild)
      await showStatusEmbed(interaction, settings)
      break
    default:
      await interaction.followUp({
        content: '❌ Invalid category selected',
        ephemeral: true,
      })
  }
}

/**
 * Handle back button to return to main admin hub
 */
export async function handleAdminBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('⚙️ Admin Hub')
    .setDescription(
      'Welcome to the Mina admin hub! Choose a category below to get started.\n\n' +
        '**Server Settings** - Manage updates channel and staff roles\n' +
        '**Mina AI** - Configure AI responses and behavior\n' +
        '**Logging** - Set up moderation logs\n' +
        '**Status** - View current configuration'
    )
    .setFooter({ text: 'Select a category from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:category')
      .setPlaceholder('Choose an admin category')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Server Settings')
          .setDescription('Updates channel and staff roles')
          .setValue('settings')
          .setEmoji('🔧'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Mina AI')
          .setDescription('Configure AI responses')
          .setValue('minaai')
          .setEmoji('🤖'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Logging')
          .setDescription('Moderation logs configuration')
          .setValue('logs')
          .setEmoji('📋'),
        new StringSelectMenuOptionBuilder()
          .setLabel('View Status')
          .setDescription('See all current settings')
          .setValue('status')
          .setEmoji('📊'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}
