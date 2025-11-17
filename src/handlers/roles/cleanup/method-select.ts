import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show cleanup method selection menu
 */
export async function showCleanupMethodMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🧹 Role Cleanup')
    .setDescription(
      'Select a cleanup method to filter roles for deletion.\n\n' +
        '**Empty Roles** - Remove roles with no members\n' +
        '**Name Prefix** - Remove roles starting with a specific prefix\n' +
        '**Below Position** - Remove roles below a hierarchy position\n' +
        '**Older Than** - Remove roles created before a specific date'
    )
    .setFooter({ text: 'Select a cleanup method from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('roles:menu:cleanup_method')
      .setPlaceholder('Choose a cleanup method')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Empty Roles')
          .setDescription('Delete roles with no members')
          .setValue('empty')
          .setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Name Prefix')
          .setDescription('Delete roles starting with a prefix')
          .setValue('prefix')
          .setEmoji('📝'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Below Position')
          .setDescription('Delete roles below a hierarchy position')
          .setValue('below')
          .setEmoji('⬇️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Older Than')
          .setDescription('Delete roles older than N days')
          .setValue('older')
          .setEmoji('📅'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [
      menuRow,
      createSecondaryBtn({
        customId: 'roles:btn:back',
        label: 'Back to Roles Hub',
        emoji: '◀️',
      }),
    ],
  })
}

/**
 * Handle cleanup method selection
 */
export async function handleCleanupMethodMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const method = interaction.values[0] as 'empty' | 'prefix' | 'below' | 'older'

  // Only defer for 'empty' method (no modal needed)
  // For other methods, showModal() must be called without deferring
  if (method === 'empty') {
    await interaction.deferUpdate()
  }

  // Import handlers dynamically to avoid circular dependencies
  const { showParameterInputForMethod } = await import('./parameter-handlers')
  await showParameterInputForMethod(interaction, method)
}
