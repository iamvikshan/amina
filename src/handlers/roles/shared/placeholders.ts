import type { StringSelectMenuInteraction } from 'discord.js'
import { EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show a "Coming Soon" message for unimplemented features
 */
export async function showComingSoonMessage(
  interaction: StringSelectMenuInteraction,
  featureName: string
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setTitle(`🚧 ${featureName} - Coming Soon`)
    .setDescription(
      `This feature is currently under development and will be available soon!\n\n` +
        `Stay tuned for updates. 🎉`
    )
    .setFooter({ text: 'Use the button below to return to the roles hub' })

  await interaction.editReply({
    embeds: [embed],
    components: [
      createSecondaryBtn({
        customId: 'roles:btn:back',
        label: 'Back to Roles Hub',
        emoji: '◀️',
      }),
    ],
  })
}
