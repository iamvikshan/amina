import { RoleSelectMenuInteraction } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import {
  addStaffRole,
  removeStaffRole,
} from '@commands/admin/settings/staffRole'

/**
 * Handle role selection for staff roles
 */
export async function handleRoleSelect(
  interaction: RoleSelectMenuInteraction
): Promise<void> {
  const [, , action] = interaction.customId.split(':')
  const role = interaction.roles.first()

  if (!role) {
    await interaction.reply({
      content: 'no role selected',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  const settings = await getSettings(interaction.guild)

  if (action === 'staffadd') {
    await addStaffRole(interaction as any, role as any, settings)
  } else if (action === 'staffremove') {
    await removeStaffRole(interaction as any, role as any, settings)
  }
}
