import type {
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  Role,
} from 'discord.js'
import { ButtonStyle } from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import type { RoleCleanupMethod, RoleCleanupStats } from '@handlers/roles'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Filter roles based on cleanup criteria and permissions
 */
function filterRoles(
  guild: any,
  method: RoleCleanupMethod,
  params: any,
  botTopPos: number
): RoleCleanupStats {
  const keepIds = params.keepIds || new Set()
  let matched: Role[] = []

  // Match roles based on method
  switch (method) {
    case 'empty':
      matched = guild.roles.cache
        .filter((r: Role) => r.members.size === 0)
        .toJSON()
      break
    case 'prefix':
      if (params.prefix) {
        const prefix = params.prefix.toLowerCase()
        matched = guild.roles.cache
          .filter((r: Role) => r.name.toLowerCase().startsWith(prefix))
          .toJSON()
      }
      break
    case 'below':
      if (typeof params.position === 'number') {
        matched = guild.roles.cache
          .filter((r: Role) => r.position < params.position)
          .toJSON()
      }
      break
    case 'older':
      if (typeof params.days === 'number') {
        const cutoff = Date.now() - params.days * 24 * 60 * 60 * 1000
        matched = guild.roles.cache
          .filter((r: Role) => (r.createdTimestamp || 0) < cutoff)
          .toJSON()
      }
      break
  }

  // Apply keep filter
  if (keepIds.size > 0) {
    matched = matched.filter(r => !keepIds.has(r.id))
  }

  // Filter out undeletable roles
  const skipped: Array<{ role: Role; reason: string }> = []
  const deletable: Role[] = []

  for (const role of matched) {
    if (role.managed) {
      skipped.push({ role, reason: 'managed role' })
      continue
    }
    if (role.id === role.guild.roles.everyone.id) {
      skipped.push({ role, reason: '@everyone' })
      continue
    }
    if (role.position >= botTopPos) {
      skipped.push({ role, reason: 'above or equal to bot role' })
      continue
    }
    deletable.push(role)
  }

  return { matched, deletable, skipped }
}

/**
 * Summarize roles for display (with limit)
 */
function summarizeRoles(roles: Role[], limit = 20): string {
  if (roles.length === 0) return 'None'
  const list = roles
    .slice(0, limit)
    .map(r => `• ${r.name}`)
    .join('\n')
  return roles.length > limit
    ? `${list}\n… and ${roles.length - limit} more`
    : list
}

/**
 * Show cleanup preview with confirmation buttons
 */
export async function showCleanupPreview(
  interaction:
    | StringSelectMenuInteraction
    | RoleSelectMenuInteraction
    | ModalSubmitInteraction
    | ButtonInteraction,
  method: RoleCleanupMethod,
  params: any
): Promise<void> {
  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({ content: 'guild not found' })
    return
  }

  // Ensure we have a fresh, full role cache
  await guild.roles.fetch().catch(() => {})

  const botMember = guild.members.me
  const botTopPos = botMember?.roles.highest.position ?? Number.MAX_SAFE_INTEGER

  const stats = filterRoles(guild, method, params, botTopPos)

  // Safety cap check
  const MAX_DELETE = 250
  const isTooMany = stats.deletable.length > MAX_DELETE

  const methodNames = {
    empty: 'empty roles',
    prefix: `prefix: "${params.prefix}"`,
    below: `below position ${params.position}`,
    older: `older than ${params.days} days`,
  }

  const embed = isTooMany ? MinaEmbed.error() : MinaEmbed.warning()
  embed
    .setTitle('role cleanup preview')
    .setDescription(
      isTooMany
        ? `**safety limit exceeded!**\n\nrefusing to delete more than ${MAX_DELETE} roles in one operation.\nplease narrow your filter criteria.`
        : `**method:** ${methodNames[method]}\n\n` +
            `review the roles that will be deleted below. this action **cannot be undone**.`
    )
    .addFields(
      { name: 'matched', value: String(stats.matched.length), inline: true },
      {
        name: 'deletable',
        value: String(stats.deletable.length),
        inline: true,
      },
      { name: 'skipped', value: String(stats.skipped.length), inline: true }
    )

  if (!isTooMany && stats.deletable.length > 0) {
    embed.addFields({
      name: 'will delete',
      value: summarizeRoles(stats.deletable, 15),
    })
  }

  if (stats.skipped.length > 0) {
    embed.addFields({
      name: 'skipped roles',
      value: summarizeRoles(
        stats.skipped.map(s => s.role),
        10
      ),
    })
  }

  if (isTooMany) {
    // Only show back button if too many
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('roles:btn:back_cleanup')],
    })
    return
  }

  if (stats.deletable.length === 0) {
    embed.setDescription(
      `**method:** ${methodNames[method]}\n\n` +
        `no roles match your criteria or all matched roles are protected.`
    )
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('roles:btn:back_cleanup')],
    })
    return
  }

  // Encode state for confirm button
  const stateParams = JSON.stringify(params)
  const confirmCustomId =
    `roles:btn:confirm|method:${method}|params:${Buffer.from(stateParams).toString('base64')}`.substring(
      0,
      100
    )

  const confirmBtn = MinaButtons.custom(
    confirmCustomId,
    `confirm delete (${stats.deletable.length})`,
    ButtonStyle.Danger
  )

  const cancelBtn = MinaButtons.nah('roles:btn:cancel')

  // Create a combined row for both buttons
  const buttonRow = MinaRows.from(confirmBtn, cancelBtn)

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}
