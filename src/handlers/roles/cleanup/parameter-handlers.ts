import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  RoleSelectMenuBuilder,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import type { RoleCleanupMethod } from '@handlers/roles'

/**
 * Show parameter input for the selected cleanup method
 * Note: For methods using modals (prefix, below, older), the interaction must NOT be deferred
 * before calling this function, as showModal() requires an undeferred interaction.
 */
export async function showParameterInputForMethod(
  interaction: StringSelectMenuInteraction,
  method: RoleCleanupMethod
): Promise<void> {
  switch (method) {
    case 'empty':
      // Empty roles don't need parameters, go directly to role keep select
      await showRoleKeepSelect(interaction, method)
      break
    case 'prefix':
      await showPrefixModal(interaction)
      break
    case 'below':
      await showPositionModal(interaction)
      break
    case 'older':
      await showOlderModal(interaction)
      break
  }
}

/**
 * Show modal for prefix input
 */
async function showPrefixModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('roles:modal:prefix')
    .setTitle('Cleanup Roles by Prefix')

  const prefixInput = new TextInputBuilder()
    .setCustomId('prefix')
    .setLabel('Role Name Prefix')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., temp-, old-')
    .setRequired(true)
    .setMaxLength(32)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    prefixInput
  )

  modal.addComponents(firstRow)
  await interaction.showModal(modal)
}

/**
 * Show modal for position input
 */
async function showPositionModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('roles:modal:position')
    .setTitle('Cleanup Roles Below Position')

  const positionInput = new TextInputBuilder()
    .setCustomId('position')
    .setLabel('Position Threshold')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 5 (roles below position 5)')
    .setRequired(true)
    .setMaxLength(5)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    positionInput
  )

  modal.addComponents(firstRow)
  await interaction.showModal(modal)
}

/**
 * Show modal for older than input
 */
async function showOlderModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('roles:modal:older')
    .setTitle('Cleanup Roles Older Than')

  const daysInput = new TextInputBuilder()
    .setCustomId('days')
    .setLabel('Age in Days')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 30 (roles older than 30 days)')
    .setRequired(true)
    .setMaxLength(5)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    daysInput
  )

  modal.addComponents(firstRow)
  await interaction.showModal(modal)
}

/**
 * Handle modal submissions for cleanup parameters
 */
export async function handleCleanupModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const [, , modalType] = interaction.customId.split(':')

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  switch (modalType) {
    case 'prefix': {
      const prefix = interaction.fields.getTextInputValue('prefix')
      if (!prefix || prefix.trim().length === 0) {
        await interaction.editReply({
          content: '❌ Please provide a valid prefix',
        })
        return
      }
      await showRoleKeepSelect(interaction as any, 'prefix', {
        prefix: prefix.trim(),
      })
      break
    }
    case 'position': {
      const positionStr = interaction.fields.getTextInputValue('position')
      const position = parseInt(positionStr, 10)
      if (isNaN(position) || position < 0) {
        await interaction.editReply({
          content: '❌ Please provide a valid positive number for position',
        })
        return
      }
      await showRoleKeepSelect(interaction as any, 'below', { position })
      break
    }
    case 'older': {
      const daysStr = interaction.fields.getTextInputValue('days')
      const days = parseInt(daysStr, 10)
      if (isNaN(days) || days < 1) {
        await interaction.editReply({
          content: '❌ Please provide a valid positive number of days',
        })
        return
      }
      await showRoleKeepSelect(interaction as any, 'older', { days })
      break
    }
  }
}

/**
 * Show role select menu to choose roles to keep (optional)
 */
async function showRoleKeepSelect(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
  method: RoleCleanupMethod,
  params?: any
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🧹 Role Cleanup - Select Roles to Keep')
    .setDescription(
      'Optionally select roles you want to **keep** (exclude from deletion).\n\n' +
        'If you don\'t want to exclude any roles, click "Continue Without Exclusions".'
    )
    .setFooter({ text: 'Select roles to exclude from cleanup' })

  // Encode method and params in custom_id
  const stateParams = params ? JSON.stringify(params) : ''
  const customId = `roles:role:keep|method:${method}|params:${Buffer.from(stateParams).toString('base64')}`

  const roleSelectRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(customId.substring(0, 100)) // Discord limit
        .setPlaceholder('Select roles to keep (optional)')
        .setMinValues(0)
        .setMaxValues(25)
    )

  const continueBtn = createSecondaryBtn({
    customId:
      `roles:btn:continue|method:${method}|params:${Buffer.from(stateParams).toString('base64')}`.substring(
        0,
        100
      ),
    label: 'Continue Without Exclusions',
    emoji: '▶️',
  })

  const backBtn = createSecondaryBtn({
    customId: 'roles:btn:back_cleanup',
    label: 'Back',
    emoji: '◀️',
  })

  // Create a combined row for both buttons
  const buttonRow = new ActionRowBuilder<any>().addComponents(
    continueBtn.components[0],
    backBtn.components[0]
  )

  await interaction.editReply({
    embeds: [embed],
    components: [roleSelectRow, buttonRow],
  })
}

/**
 * Handle role keep select interaction
 */
export async function handleRoleKeepSelect(
  interaction: RoleSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  // Parse custom_id to get method and params
  const customIdParts = interaction.customId.split('|')
  const methodPart = customIdParts.find(p => p.startsWith('method:'))
  const paramsPart = customIdParts.find(p => p.startsWith('params:'))

  if (!methodPart) {
    await interaction.followUp({
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

  const keepIds = new Set(interaction.roles.map(r => r.id))

  // Import preview handler dynamically
  const { showCleanupPreview } = await import('./preview')
  await showCleanupPreview(interaction, method, { ...params, keepIds })
}

/**
 * Handle continue button (no exclusions)
 */
export async function handleContinueButton(interaction: any): Promise<void> {
  await interaction.deferUpdate()

  const customIdParts = interaction.customId.split('|')
  const methodPart = customIdParts.find((p: string) => p.startsWith('method:'))
  const paramsPart = customIdParts.find((p: string) => p.startsWith('params:'))

  if (!methodPart) {
    await interaction.followUp({
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

  const { showCleanupPreview } = await import('./preview')
  await showCleanupPreview(interaction, method, {
    ...params,
    keepIds: new Set(),
  })
}
