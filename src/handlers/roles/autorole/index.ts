import type {
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ButtonInteraction,
  Role,
} from 'discord.js'
import {
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import {
  createSuccessBtn,
  createDangerBtn,
  createSecondaryBtn,
} from '@helpers/componentHelper'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show autorole management menu with current status
 */
export async function showAutoroleMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({ content: '❌ Guild not found' })
    return
  }

  const settings = await getSettings(guild)
  const currentAutoroleId = settings.autorole
  let currentRole: Role | null = null

  if (currentAutoroleId) {
    currentRole = guild.roles.cache.get(currentAutoroleId) || null
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('⚡ Autorole Management')
    .setDescription(
      'Configure automatic role assignment for new members.\n\n' +
        '**Current Status:** ' +
        (currentRole ? `Enabled - ${currentRole}` : '❌ Disabled') +
        '\n\n' +
        'Use the buttons below to enable or disable autorole.'
    )
    .setFooter({ text: 'Automatically assign roles to new members' })

  if (currentRole) {
    embed.addFields({
      name: '📋 Current Autorole',
      value: `${currentRole.name} (${currentRole.id})`,
      inline: false,
    })
  }

  const enableBtn = createSuccessBtn({
    customId: 'roles:btn:autorole_enable',
    label: currentRole ? 'Change Autorole' : 'Enable Autorole',
    emoji: '✅',
  })

  const disableBtn = createDangerBtn({
    customId: 'roles:btn:autorole_disable',
    label: 'Disable Autorole',
    emoji: '❌',
    disabled: !currentRole,
  })

  const backBtn = createSecondaryBtn({
    customId: 'roles:btn:back',
    label: 'Back to Roles Hub',
    emoji: '◀️',
  })

  // Create a combined row for all buttons
  const buttonRow = new ActionRowBuilder<any>().addComponents(
    enableBtn.components[0],
    disableBtn.components[0],
    backBtn.components[0]
  )

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}

/**
 * Handle autorole enable button - show role select
 */
export async function handleAutoroleEnableButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('⚡ Enable Autorole')
    .setDescription(
      'Select the role you want to automatically assign to new members.\n\n' +
        '⚠️ **Requirements:**\n' +
        '• Role must be below my highest role\n' +
        '• Role cannot be managed by an integration\n' +
        '• Role cannot be @everyone'
    )
    .setFooter({ text: 'Select a role from the menu below' })

  const roleSelectRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('roles:role:autorole_select')
        .setPlaceholder('Select a role for autorole')
        .setMinValues(1)
        .setMaxValues(1)
    )

  const cancelBtn = createSecondaryBtn({
    customId: 'roles:btn:autorole_cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [roleSelectRow, cancelBtn],
  })
}

/**
 * Handle autorole role selection
 */
export async function handleAutoroleRoleSelect(
  interaction: RoleSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({ content: '❌ Guild not found' })
    return
  }

  const selectedRole = interaction.roles.first()
  if (!selectedRole) {
    await interaction.editReply({ content: '❌ No role selected' })
    return
  }

  // Get the full Role object from the guild cache to ensure we have all properties
  const role = guild.roles.cache.get(selectedRole.id)
  if (!role) {
    await interaction.editReply({ content: '❌ Role not found in guild' })
    return
  }

  // Validate role
  const validation = validateAutorole(guild, role)
  if (!validation.valid) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle('❌ Invalid Role')
      .setDescription(
        validation.reason || 'This role cannot be used as autorole.'
      )

    await interaction.editReply({
      embeds: [embed],
      components: [
        createSecondaryBtn({
          customId: 'roles:btn:autorole_enable',
          label: 'Try Again',
          emoji: '🔄',
        }),
        createSecondaryBtn({
          customId: 'roles:btn:back',
          label: 'Back to Roles Hub',
          emoji: '◀️',
        }),
      ],
    })
    return
  }

  // Save autorole
  await updateSettings(guild.id, { autorole: role.id })

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setTitle('✅ Autorole Enabled')
    .setDescription(
      `Successfully set ${role} as the autorole!\n\n` +
        `New members will automatically receive this role when they join the server. 🎉`
    )
    .addFields({
      name: '⚡ Autorole',
      value: `${role.name} (${role.id})`,
      inline: false,
    })
    .setFooter({
      text: `Configured by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()

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
 * Handle autorole disable button - show confirmation
 */
export async function handleAutoroleDisableButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({ content: '❌ Guild not found' })
    return
  }

  const settings = await getSettings(guild)
  const currentAutoroleId = settings.autorole
  const currentRole = currentAutoroleId
    ? guild.roles.cache.get(currentAutoroleId)
    : null

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setTitle('⚠️ Disable Autorole')
    .setDescription(
      'Are you sure you want to disable autorole?\n\n' +
        (currentRole
          ? `**Current Role:** ${currentRole}\n\n`
          : 'Autorole is currently disabled.\n\n') +
        'New members will no longer automatically receive a role.'
    )

  const confirmBtn = createDangerBtn({
    customId: 'roles:btn:autorole_disable_confirm',
    label: 'Confirm Disable',
    emoji: '⚠️',
  })

  const cancelBtn = createSecondaryBtn({
    customId: 'roles:btn:autorole_cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  const buttonRow = new ActionRowBuilder<any>().addComponents(
    confirmBtn.components[0],
    cancelBtn.components[0]
  )

  await interaction.editReply({
    embeds: [embed],
    components: [buttonRow],
  })
}

/**
 * Handle autorole disable confirmation
 */
export async function handleAutoroleDisableConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const guild = interaction.guild
  if (!guild) {
    await interaction.editReply({ content: '❌ Guild not found' })
    return
  }

  // Disable autorole
  await updateSettings(guild.id, { autorole: null })

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setTitle('✅ Autorole Disabled')
    .setDescription(
      'Autorole has been disabled successfully.\n\n' +
        'New members will no longer automatically receive a role.'
    )
    .setFooter({
      text: `Disabled by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()

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
 * Handle autorole cancel button
 */
export async function handleAutoroleCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showAutoroleMenu(interaction as any)
}

/**
 * Validate if a role can be used as autorole
 */
function validateAutorole(
  guild: any,
  role: Role
): { valid: boolean; reason?: string } {
  if (role.id === guild.roles.everyone.id) {
    return {
      valid: false,
      reason:
        "❌ You cannot set `@everyone` as the autorole! That wouldn't be fair! 🙅‍♀️✨",
    }
  }

  if (!guild.members.me?.permissions.has('ManageRoles')) {
    return {
      valid: false,
      reason:
        "❌ I don't have the `ManageRoles` permission. Please check my permissions! 🥺",
    }
  }

  if (
    guild.members.me &&
    guild.members.me.roles.highest.position < role.position
  ) {
    return {
      valid: false,
      reason:
        "❌ I don't have the permissions to assign this role. Is it higher than mine? 😟",
    }
  }

  if (role.managed) {
    return {
      valid: false,
      reason:
        "❌ This role is managed by an integration, so I can't assign it! 😭",
    }
  }

  return { valid: true }
}
