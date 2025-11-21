import { ActionRowBuilder } from 'discord.js'
import { createPrimaryBtn } from '@helpers/componentHelper'

/**
 * Create edit button for profile view embed
 */
export function createEditButton(): ActionRowBuilder {
  return createPrimaryBtn({
    customId: 'profile:btn:edit_from_view',
    label: 'Edit Profile',
    emoji: '✏️',
  })
}
