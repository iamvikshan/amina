import { StringSelectMenuInteraction } from 'discord.js'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show status embed with current settings
 */
export async function showStatusEmbed(
  interaction: StringSelectMenuInteraction,
  settings: any
): Promise<void> {
  const embed = MinaEmbed.primary().setTitle('server settings status')

  // Updates channel
  const updatesChannel = settings.server?.updates_channel
    ? `<#${settings.server.updates_channel}>`
    : 'not set'

  // Staff roles
  const staffRoles =
    settings.server?.staff_roles?.length > 0
      ? settings.server.staff_roles.map((r: string) => `<@&${r}>`).join(', ')
      : 'none'

  // Autorole
  const autorole =
    settings.autorole && settings.autorole.length > 0
      ? settings.autorole.map((r: any) => `<@&${r}>`).join(', ')
      : 'not set'

  // Log channel
  const logChannel = settings.moderation?.log_channel
    ? `<#${settings.moderation.log_channel}>`
    : 'not set'

  // Max warns
  const maxWarns = settings.moderation?.max_warns
    ? `${settings.moderation.max_warns.limit} (action: ${settings.moderation.max_warns.action})`
    : 'not configured'

  // Welcome/Farewell
  const welcomeChannel = settings.welcome?.enabled
    ? `<#${settings.welcome.channel}>`
    : 'not enabled'
  const farewellChannel = settings.farewell?.enabled
    ? `<#${settings.farewell.channel}>`
    : 'not enabled'

  embed.setDescription(
    `**updates channel:** ${updatesChannel}\n` +
      `**staff roles:** ${staffRoles}\n` +
      `**auto role:** ${autorole}\n` +
      `**log channel:** ${logChannel}\n` +
      `**max warns:** ${maxWarns}\n` +
      `**welcome:** ${welcomeChannel}\n` +
      `**farewell:** ${farewellChannel}`
  )

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('admin:btn:back')],
  })
}
