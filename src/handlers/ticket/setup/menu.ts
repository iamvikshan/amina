import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show setup menu with configuration options
 */
export async function showSetupMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '🛠️ Ticket Setup' })
    .setDescription(
      'Configure your ticket system settings:\n\n' +
        '📨 **Setup Message** - Create ticket creation message in a channel\n' +
        '📝 **Log Channel** - Set channel for ticket logs\n' +
        '🔢 **Ticket Limit** - Set max concurrent open tickets per user\n' +
        '📂 **Manage Topics** - Add/remove/list ticket topics\n\n' +
        'Select an option below to continue:'
    )
    .setFooter({ text: 'Use the back button to return to main hub' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:setup')
      .setPlaceholder('⚙️ Select a setup option...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Setup Message')
          .setDescription('Create ticket creation message')
          .setValue('message')
          .setEmoji('📨'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Log Channel')
          .setDescription('Configure log channel for tickets')
          .setValue('log')
          .setEmoji('📝'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Ticket Limit')
          .setDescription('Set max open tickets per user')
          .setValue('limit')
          .setEmoji('🔢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Manage Topics')
          .setDescription('Add, remove, or list ticket topics')
          .setValue('topics')
          .setEmoji('📂')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back',
    label: 'Back to Ticket Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle setup menu selection
 */
export async function handleSetupMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const option = interaction.values[0]

  switch (option) {
    case 'message':
      // Show channel select for ticket message
      const { showMessageChannelSelect } = await import('./message')
      await showMessageChannelSelect(interaction)
      break
    case 'log':
      // Show channel select for log channel
      const { showLogChannelSelect } = await import('./log-channel')
      await showLogChannelSelect(interaction)
      break
    case 'limit':
      // Show modal for limit input
      const { showLimitModal } = await import('./limit')
      await showLimitModal(interaction)
      break
    case 'topics':
      // Show topics submenu
      const { showTopicsMenu } = await import('./topics')
      await interaction.deferUpdate()
      await showTopicsMenu(interaction)
      break
    default:
      await interaction.reply({
        content: '❌ Invalid setup option',
        flags: MessageFlags.Ephemeral,
      })
  }
}
