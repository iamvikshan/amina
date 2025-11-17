import { StringSelectMenuInteraction, EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show status embed with current settings
 */
export async function showStatusEmbed(
  interaction: StringSelectMenuInteraction,
  settings: any
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('📊 Server Settings Status')

  // Updates channel
  const updatesChannel = settings.server?.updates_channel
    ? `<#${settings.server.updates_channel}>`
    : 'Not set'

  // Staff roles
  const staffRoles =
    settings.server?.staff_roles?.length > 0
      ? settings.server.staff_roles.map((r: string) => `<@&${r}>`).join(', ')
      : 'None'

  // Autorole
  const autorole =
    settings.autorole && settings.autorole.length > 0
      ? settings.autorole.map((r: any) => `<@&${r}>`).join(', ')
      : 'Not set'

  // Log channel
  const logChannel = settings.moderation?.log_channel
    ? `<#${settings.moderation.log_channel}>`
    : 'Not set'

  // Max warns
  const maxWarns = settings.moderation?.max_warns
    ? `${settings.moderation.max_warns.limit} (Action: ${settings.moderation.max_warns.action})`
    : 'Not configured'

  // Welcome/Farewell
  const welcomeChannel = settings.welcome?.enabled
    ? `<#${settings.welcome.channel}>`
    : 'Not enabled'
  const farewellChannel = settings.farewell?.enabled
    ? `<#${settings.farewell.channel}>`
    : 'Not enabled'

  embed.setDescription(
    `**Updates Channel:** ${updatesChannel}\n` +
      `**Staff Roles:** ${staffRoles}\n` +
      `**Auto Role:** ${autorole}\n` +
      `**Log Channel:** ${logChannel}\n` +
      `**Max Warns:** ${maxWarns}\n` +
      `**Welcome:** ${welcomeChannel}\n` +
      `**Farewell:** ${farewellChannel}`
  )

  await interaction.editReply({
    embeds: [embed],
    components: [
      createSecondaryBtn({
        customId: 'admin:btn:back',
        label: 'Back to Admin Hub',
        emoji: '◀️',
      }),
    ],
  })
}
