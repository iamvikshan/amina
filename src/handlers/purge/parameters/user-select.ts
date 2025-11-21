import {
  UserSelectMenuInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  UserSelectMenuBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show user selection menu
 */
export async function showUserSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('👤 Select User')
    .setDescription('Select the user whose messages you want to delete.')
    .setFooter({ text: 'Select a user from the menu below' })

  const menu = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId('purge:user:select')
      .setPlaceholder('👤 Select a user...')
  )

  const backButton = createSecondaryBtn({
    customId: 'purge:btn:back',
    label: 'Back to Type Selection',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
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
