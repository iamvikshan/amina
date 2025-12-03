import {
  UserSelectMenuInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  UserSelectMenuBuilder,
} from 'discord.js'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show user selection menu
 */
export async function showUserSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('select user')
    .setDescription('select the user whose messages you want to delete.')
    .setFooter({ text: 'select a user from the menu below' })

  const menu = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId('purge:user:select')
      .setPlaceholder('select a user...')
  )

  const backRow = MinaRows.backRow('purge:btn:back')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
  })
}

/**
 * Handle user selection
 */
export async function handleUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  const userId = interaction.values[0]

  await interaction.deferUpdate()

  // Proceed to amount selection
  const { showAmountSelect } = await import('./amount-select')
  await showAmountSelect(interaction as any, 'user', { userId })
}
