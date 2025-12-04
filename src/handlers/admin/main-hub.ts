import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { showServerSettingsMenu } from './settings'
import { showMinaAIMenu } from './ai'
import { showLoggingMenu } from './logging'
import { showStatusEmbed } from './settings/embeds'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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
    case 'status': {
      const settings = await getSettings(interaction.guild)
      await showStatusEmbed(interaction, settings)
      break
    }
    default:
      await interaction.followUp({
        content: 'invalid category selected',
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

  const embed = MinaEmbed.primary()
    .setTitle('admin hub')
    .setDescription(
      'welcome to the mina admin hub! choose a category below to get started.\n\n' +
        '**server settings** - manage updates channel and staff roles\n' +
        '**mina ai** - configure ai responses and behavior\n' +
        '**logging** - set up moderation logs\n' +
        '**status** - view current configuration'
    )
    .setFooter({ text: 'select a category from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:category')
      .setPlaceholder('choose an admin category')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('server settings')
          .setDescription('updates channel and staff roles')
          .setValue('settings'),
        new StringSelectMenuOptionBuilder()
          .setLabel('mina ai')
          .setDescription('configure ai responses')
          .setValue('minaai'),
        new StringSelectMenuOptionBuilder()
          .setLabel('logging')
          .setDescription('moderation logs configuration')
          .setValue('logs'),
        new StringSelectMenuOptionBuilder()
          .setLabel('view status')
          .setDescription('see all current settings')
          .setValue('status'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}
