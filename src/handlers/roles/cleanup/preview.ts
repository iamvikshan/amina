import type {
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  Role,
} from 'discord.js'
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createDangerBtn, createSecondaryBtn } from '@helpers/componentHelper'
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
    await interaction.editReply({ content: '❌ Guild not found' })
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
    empty: 'Empty Roles',
    prefix: `Prefix: "${params.prefix}"`,
    below: `Below Position ${params.position}`,
    older: `Older than ${params.days} days`,
  }

  const embed = new EmbedBuilder()
    .setColor(isTooMany ? EMBED_COLORS.ERROR : EMBED_COLORS.WARNING)
    .setTitle('🧹 Role Cleanup Preview')
    .setDescription(
      isTooMany
        ? `⚠️ **Safety limit exceeded!**\n\nRefusing to delete more than ${MAX_DELETE} roles in one operation.\nPlease narrow your filter criteria.`
        : `**Method:** ${methodNames[method]}\n\n` +
            `Review the roles that will be deleted below. This action **cannot be undone**.`
    )
    .addFields(
      { name: '📊 Matched', value: String(stats.matched.length), inline: true },
      {
        name: '✅ Deletable',
        value: String(stats.deletable.length),
        inline: true,
      },
      { name: '⏭️ Skipped', value: String(stats.skipped.length), inline: true }
    )

  if (!isTooMany && stats.deletable.length > 0) {
    embed.addFields({
      name: '🗑️ Will Delete',
      value: summarizeRoles(stats.deletable, 15),
    })
  }

  if (stats.skipped.length > 0) {
    embed.addFields({
      name: '⏭️ Skipped Roles',
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
      components: [
        createSecondaryBtn({
          customId: 'roles:btn:back_cleanup',
          label: 'Back to Cleanup Methods',
          emoji: '◀️',
        }),
      ],
    })
    return
  }

  if (stats.deletable.length === 0) {
    embed.setDescription(
      `**Method:** ${methodNames[method]}\n\n` +
        `No roles match your criteria or all matched roles are protected.`
    )
    await interaction.editReply({
      embeds: [embed],
      components: [
        createSecondaryBtn({
          customId: 'roles:btn:back_cleanup',
          label: 'Back to Cleanup Methods',
          emoji: '◀️',
        }),
      ],
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

  const confirmBtn = createDangerBtn({
    customId: confirmCustomId,
    label: `Confirm Delete (${stats.deletable.length})`,
    emoji: '⚠️',
  })

  const cancelBtn = createSecondaryBtn({
    customId: 'roles:btn:cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  // Create a combined row for both buttons
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    confirmBtn.components[0],
    cancelBtn.components[0]
  )

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}
