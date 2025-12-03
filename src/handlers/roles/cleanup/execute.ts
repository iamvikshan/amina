import type { ButtonInteraction, Role } from 'discord.js'
import { MessageFlags } from 'discord.js'
import { MinaRows } from '@helpers/componentHelper'
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
 * Execute role cleanup (deletion)
 */
export async function executeCleanup(
  interaction: ButtonInteraction,
  method: RoleCleanupMethod,
  params: any
): Promise<void> {
  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({ content: 'guild not found' })
    return
  }

  await interaction.deferUpdate()

  // Refresh role cache
  await guild.roles.fetch().catch(() => {})

  const botMember = guild.members.me
  const botTopPos = botMember?.roles.highest.position ?? Number.MAX_SAFE_INTEGER

  const stats = filterRoles(guild, method, params, botTopPos)

  // Safety cap
  const MAX_DELETE = 250
  if (stats.deletable.length > MAX_DELETE) {
    const embed = MinaEmbed.error()
      .setTitle('cleanup failed')
      .setDescription(
        `safety limit exceeded! cannot delete more than ${MAX_DELETE} roles in one operation.`
      )
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('roles:btn:back')],
    })
    return
  }

  if (stats.deletable.length === 0) {
    const embed = MinaEmbed.warning()
      .setTitle('no roles to delete')
      .setDescription(
        'no roles match your criteria or all matched roles are protected.'
      )
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('roles:btn:back')],
    })
    return
  }

  // Execute deletion
  let deleted = 0
  const errors: Array<{ role: Role; error: any }> = []

  for (const role of stats.deletable) {
    try {
      await role.delete(
        `Bulk cleanup by ${interaction.user.tag} (${interaction.user.id})`
      )
      deleted += 1
    } catch (err) {
      errors.push({ role, error: err })
    }
  }

  // Show results
  const embed = errors.length > 0 ? MinaEmbed.warning() : MinaEmbed.success()
  embed
    .setTitle('cleanup complete')
    .setDescription(
      `successfully deleted **${deleted}** role${deleted !== 1 ? 's' : ''}.` +
        (errors.length > 0
          ? `\n\nfailed to delete ${errors.length} role(s).`
          : '')
    )
    .addFields(
      { name: 'deleted', value: String(deleted), inline: true },
      { name: 'failed', value: String(errors.length), inline: true },
      { name: 'skipped', value: String(stats.skipped.length), inline: true }
    )
    .setFooter({
      text: `cleanup executed by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()

  if (errors.length > 0) {
    const errorList = errors
      .slice(0, 10)
      .map(e => `- ${e.role.name} (${e.role.id})`)
      .join('\n')
    embed.addFields({
      name: 'failed deletions',
      value: errorList || 'N/A',
    })
  }

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('roles:btn:back')],
  })
}

/**
 * Handle cleanup confirmation button
 */
export async function handleCleanupConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  const customIdParts = interaction.customId.split('|')
  const methodPart = customIdParts.find(p => p.startsWith('method:'))
  const paramsPart = customIdParts.find(p => p.startsWith('params:'))

  if (!methodPart) {
    await interaction.reply({
      content: 'invalid interaction state',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const method = methodPart.split(':')[1] as RoleCleanupMethod
  let params = {}
  if (paramsPart) {
    const base64Params = paramsPart.split(':')[1]
    try {
      const decoded = Buffer.from(base64Params, 'base64').toString('utf-8')
      params = decoded ? JSON.parse(decoded) : {}
    } catch (_err) {
      // Ignore parsing errors
    }
  }

  await executeCleanup(interaction, method, params)
}

/**
 * Handle cleanup cancellation button
 */
export async function handleCleanupCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = MinaEmbed.primary()
    .setTitle('cleanup cancelled')
    .setDescription(
      'role cleanup operation has been cancelled. no roles were deleted.'
    )

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('roles:btn:back')],
  })
}
