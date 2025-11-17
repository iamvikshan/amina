import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show Truth or Dare operations menu
 */
export async function showTodMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎲 Truth or Dare Management')
    .setDescription(
      'Manage Truth or Dare questions! 🎯\n\n' +
        '**Select an operation:**\n' +
        '➕ **Add Question** - Add a new ToD question\n' +
        '➖ **Remove Question** - Delete a question by ID\n\n' +
        '⚠️ **Note:** Question IDs follow the format: T1, D2, NHIE3, etc.'
    )
    .setFooter({ text: 'Select an operation to begin' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:tod')
      .setPlaceholder('Select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Add Question')
          .setDescription('Add a new Truth or Dare question')
          .setValue('add')
          .setEmoji('➕'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Remove Question')
          .setDescription('Delete a question by ID')
          .setValue('remove')
          .setEmoji('➖')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_tod',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle ToD operation selection
 */
export async function handleTodMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  await interaction.deferUpdate()

  switch (operation) {
    case 'add': {
      const { showAddTodModal } = await import('./add')
      await showAddTodModal(interaction)
      break
    }
    case 'remove': {
      const { showRemoveTodModal } = await import('./remove')
      await showRemoveTodModal(interaction)
      break
    }
    default:
      await interaction.followUp({
        content: '❌ Invalid operation selected',
        ephemeral: true,
      })
  }
}
