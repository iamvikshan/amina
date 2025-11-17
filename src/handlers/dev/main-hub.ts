import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show main dev hub with category selection
 */
export async function showDevHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('⚙️ Developer Hub')
    .setDescription(
      'Welcome to the Developer Hub! 🛠️\n\n' +
        '**Select a category:**\n' +
        '🎭 **Presence Management** - Configure bot presence/status\n' +
        '🎲 **Truth or Dare** - Add/remove ToD questions\n' +
        '🔄 **Command Reload** - Reload commands, events, or contexts\n' +
        '⚡ **Trigger Settings** - Trigger server onboarding\n' +
        '📋 **List Servers** - View all servers the bot is in\n' +
        '🤖 **Mina AI** - Configure Amina AI settings\n\n' +
        '⚠️ **Note:** All operations are developer-only.'
    )
    .setFooter({ text: 'Select a category to begin' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:category')
      .setPlaceholder('Select a category...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Presence Management')
          .setDescription('Configure bot presence/status')
          .setValue('presence')
          .setEmoji('🎭'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Truth or Dare')
          .setDescription('Add/remove ToD questions')
          .setValue('tod')
          .setEmoji('🎲'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Command Reload')
          .setDescription('Reload commands, events, or contexts')
          .setValue('reload')
          .setEmoji('🔄'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Trigger Settings')
          .setDescription('Trigger server onboarding')
          .setValue('trig-settings')
          .setEmoji('⚡'),
        new StringSelectMenuOptionBuilder()
          .setLabel('List Servers')
          .setDescription('View all servers the bot is in')
          .setValue('listservers')
          .setEmoji('📋'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Mina AI')
          .setDescription('Configure Amina AI settings')
          .setValue('minaai')
          .setEmoji('🤖')
      )
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menu],
  })
}

/**
 * Handle category selection
 */
export async function handleCategoryMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const category = interaction.values[0]

  await interaction.deferUpdate()

  // Route to appropriate category handler
  switch (category) {
    case 'presence': {
      const { showPresenceMenu } = await import('./presence')
      await showPresenceMenu(interaction)
      break
    }
    case 'tod': {
      const { showTodMenu } = await import('./tod')
      await showTodMenu(interaction)
      break
    }
    case 'reload': {
      const { showReloadMenu } = await import('./reload')
      await showReloadMenu(interaction)
      break
    }
    case 'trig-settings': {
      const { showTrigSettings } = await import('./trig-settings')
      await showTrigSettings(interaction)
      break
    }
    case 'listservers': {
      const { showListservers } = await import('./listservers')
      await showListservers(interaction)
      break
    }
    case 'minaai': {
      const { showMinaAiMenu } = await import('./minaai')
      await showMinaAiMenu(interaction)
      break
    }
    default:
      await interaction.followUp({
        content: '❌ Invalid category selected',
        ephemeral: true,
      })
  }
}

/**
 * Handle back button - return to main hub
 */
export async function handleDevBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showDevHub(interaction)
}
