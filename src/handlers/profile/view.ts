import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'

/**
 * Create edit button for profile view embed
 * @returns {ActionRowBuilder<ButtonBuilder>} The result.
 */
export function createEditButton(): ActionRowBuilder<ButtonBuilder> {
  return MinaRows.single(
    MinaButtons.custom(
      'profile:btn:edit_from_view',
      'edit',
      ButtonStyle.Primary,
    ),
  )
}
