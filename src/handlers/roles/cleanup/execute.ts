import type { ButtonInteraction, Role } from 'discord.js'
import { EmbedBuilder, MessageFlags } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import type { RoleCleanupMethod, RoleCleanupStats } from '@handlers/roles'

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
    await interaction.editReply({ content: '❌ Guild not found' })
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
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle('❌ Cleanup Failed')
      .setDescription(
        `Safety limit exceeded! Cannot delete more than ${MAX_DELETE} roles in one operation.`
      )
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
    return
  }

  if (stats.deletable.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.WARNING)
      .setTitle('⚠️ No Roles to Delete')
      .setDescription(
        'No roles match your criteria or all matched roles are protected.'
      )
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
  const embed = new EmbedBuilder()
    .setColor(errors.length > 0 ? EMBED_COLORS.WARNING : EMBED_COLORS.SUCCESS)
    .setTitle('✅ Cleanup Complete')
    .setDescription(
      `Successfully deleted **${deleted}** role${deleted !== 1 ? 's' : ''}.` +
        (errors.length > 0
          ? `\n\n⚠️ Failed to delete ${errors.length} role(s).`
          : '')
    )
    .addFields(
      { name: '✅ Deleted', value: String(deleted), inline: true },
      { name: '❌ Failed', value: String(errors.length), inline: true },
      { name: '⏭️ Skipped', value: String(stats.skipped.length), inline: true }
    )
    .setFooter({
      text: `Cleanup executed by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()

  if (errors.length > 0) {
    const errorList = errors
      .slice(0, 10)
      .map(e => `• ${e.role.name} (${e.role.id})`)
      .join('\n')
    embed.addFields({
      name: '❌ Failed Deletions',
      value: errorList || 'N/A',
    })
  }

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
      content: '❌ Invalid interaction state',
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
    } catch (err) {
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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('❌ Cleanup Cancelled')
    .setDescription(
      'Role cleanup operation has been cancelled. No roles were deleted.'
    )

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
