import type { StringSelectMenuInteraction } from 'discord.js'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show a "Coming Soon" message for unimplemented features
 */
export async function showComingSoonMessage(
  interaction: StringSelectMenuInteraction,
  featureName: string
): Promise<void> {
  const embed = MinaEmbed.warning()
    .setTitle(`${featureName.toLowerCase()} - coming soon`)
    .setDescription(
      `this feature is currently under development and will be available soon!\n\n` +
        `stay tuned for updates.`
    )
    .setFooter({ text: 'use the button below to return to the roles hub' })

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('roles:btn:back')],
  })
}
