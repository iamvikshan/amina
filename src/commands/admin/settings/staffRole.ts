import { ChatInputCommandInteraction, Role } from 'discord.js'
import { updateSetupStatus, createSetupEmbed } from './setupEmbed'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

export async function addStaffRole(
  interaction: ChatInputCommandInteraction,
  role: Role,
  settings: any
): Promise<void> {
  if (settings.server.staff_roles.includes(role.id)) {
    const embed = MinaEmbed.error().setDescription(
      mina.sayf('admin.settings.staffRole.alreadyAdded', {
        role: role.toString(),
      })
    )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  if (settings.server.staff_roles.length >= 5) {
    const embed = MinaEmbed.error().setDescription(
      mina.say('admin.settings.staffRole.maxReached')
    )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  settings.server.staff_roles.push(role.id)
  await updateSetupStatus(settings)
  await settings.save()

  const setupEmbed = createSetupEmbed(settings)

  const backButton = MinaRows.backRow('admin:btn:back')

  await interaction.editReply({
    embeds: [setupEmbed],
    components: [backButton],
  })
}

export async function removeStaffRole(
  interaction: ChatInputCommandInteraction,
  role: Role,
  settings: any
): Promise<void> {
  if (!settings.server.staff_roles.includes(role.id)) {
    const embed = MinaEmbed.error().setDescription(
      mina.sayf('admin.settings.staffRole.notFound', { role: role.toString() })
    )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  settings.server.staff_roles = settings.server.staff_roles.filter(
    (r: string) => r !== role.id
  )
  await updateSetupStatus(settings)
  await settings.save()

  const setupEmbed = createSetupEmbed(settings)

  const backButton = MinaRows.backRow('admin:btn:back')

  await interaction.editReply({
    embeds: [setupEmbed],
    components: [backButton],
  })
}

export default 0
