import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show cleanup method selection menu
 */
export async function showCleanupMethodMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('role cleanup')
    .setDescription(
      'select a cleanup method to filter roles for deletion.\n\n' +
        '**empty roles** - remove roles with no members\n' +
        '**name prefix** - remove roles starting with a specific prefix\n' +
        '**below position** - remove roles below a hierarchy position\n' +
        '**older than** - remove roles created before a specific date'
    )
    .setFooter({ text: 'select a cleanup method from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('roles:menu:cleanup_method')
      .setPlaceholder('choose a cleanup method')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('empty roles')
          .setDescription('delete roles with no members')
          .setValue('empty'),
        new StringSelectMenuOptionBuilder()
          .setLabel('name prefix')
          .setDescription('delete roles starting with a prefix')
          .setValue('prefix'),
        new StringSelectMenuOptionBuilder()
          .setLabel('below position')
          .setDescription('delete roles below a hierarchy position')
          .setValue('below'),
        new StringSelectMenuOptionBuilder()
          .setLabel('older than')
          .setDescription('delete roles older than N days')
          .setValue('older'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow, MinaRows.backRow('roles:btn:back')],
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
