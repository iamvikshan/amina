import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'

/**
 * Show main ticket hub with operation selection
 */
export async function showTicketHub(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '🎫 Ticket Management Hub' })
    .setDescription(
      'Welcome to the Ticket Management Hub! 🌟\n\n' +
        '**Choose an operation:**\n' +
        '🛠️ **Setup** - Configure ticket system (message, logs, limits, topics)\n' +
        '📋 **Manage** - Runtime operations (close, add/remove users)\n\n' +
        'Select an option below to get started!'
    )
    .setFooter({ text: 'Thank you for using Amina! 💕' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:category')
      .setPlaceholder('📂 Select a category...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Setup')
          .setDescription('Configure ticket system settings')
          .setValue('setup')
          .setEmoji('🛠️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Manage')
          .setDescription('Runtime ticket operations')
          .setValue('manage')
          .setEmoji('📋')
      )
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menu],
  })
}

/**
 * Handle ticket category selection from main hub
 */
export async function handleTicketCategoryMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const category = interaction.values[0]

  await interaction.deferUpdate()

  switch (category) {
    case 'setup':
      const { showSetupMenu } = await import('./setup/menu')
      await showSetupMenu(interaction)
      break
    case 'manage':
      const { showManageMenu } = await import('./manage/menu')
      await showManageMenu(interaction)
      break
    default:
      await interaction.followUp({
        content: '❌ Invalid category selected',
        flags: MessageFlags.Ephemeral,
      })
  }
}

/**
 * Handle back button to return to main ticket hub
 */
export async function handleTicketBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showTicketHub(interaction)
}
