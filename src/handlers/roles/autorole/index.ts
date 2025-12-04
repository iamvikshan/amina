import type {
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ButtonInteraction,
  Role,
} from 'discord.js'
import { ActionRowBuilder, RoleSelectMenuBuilder } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { ButtonStyle } from 'discord.js'
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

  const embed = MinaEmbed.primary()
    .setTitle('autorole management')
    .setDescription(
      'configure automatic role assignment for new members.\n\n' +
        '**current status:** ' +
        (currentRole ? `enabled - ${currentRole}` : 'disabled') +
        '\n\n' +
        'use the buttons below to enable or disable autorole.'
    )
    .setFooter({ text: 'automatically assign roles to new members' })

  if (currentRole) {
    embed.addFields({
      name: 'current autorole',
      value: `${currentRole.name} (${currentRole.id})`,
      inline: false,
    })
  }

  const enableBtn = MinaButtons.custom(
    'roles:btn:autorole_enable',
    currentRole ? 'change autorole' : 'enable autorole',
    ButtonStyle.Success
  )

  const disableBtn = MinaButtons.custom(
    'roles:btn:autorole_disable',
    'disable autorole',
    ButtonStyle.Danger
  ).setDisabled(!currentRole)

  const backBtn = MinaButtons.back('roles:btn:back')

  // Create a combined row for all buttons
  const buttonRow = MinaRows.from(enableBtn, disableBtn, backBtn)

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

  const embed = MinaEmbed.primary()
    .setTitle('enable autorole')
    .setDescription(
      'select the role you want to automatically assign to new members.\n\n' +
        '**requirements:**\n' +
        '- role must be below my highest role\n' +
        '- role cannot be managed by an integration\n' +
        '- role cannot be @everyone'
    )
    .setFooter({ text: 'select a role from the menu below' })

  const roleSelectRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('roles:role:autorole_select')
        .setPlaceholder('select a role for autorole')
        .setMinValues(1)
        .setMaxValues(1)
    )

  const cancelBtn = MinaButtons.nah('roles:btn:autorole_cancel')

  await interaction.editReply({
    embeds: [embed],
    components: [roleSelectRow, MinaRows.single(cancelBtn)],
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
    const embed = MinaEmbed.error()
      .setTitle('invalid role')
      .setDescription(
        validation.reason || 'this role cannot be used as autorole.'
      )

    await interaction.editReply({
      embeds: [embed],
      components: [
        MinaRows.from(
          MinaButtons.custom(
            'roles:btn:autorole_enable',
            'try again',
            ButtonStyle.Secondary
          ),
          MinaButtons.back('roles:btn:back')
        ),
      ],
    })
    return
  }

  // Save autorole
  await updateSettings(guild.id, { autorole: role.id })

  const embed = MinaEmbed.success()
    .setTitle('autorole enabled')
    .setDescription(
      `successfully set ${role} as the autorole\n\n` +
        `new members will automatically receive this role when they join the server.`
    )
    .addFields({
      name: 'autorole',
      value: `${role.name} (${role.id})`,
      inline: false,
    })
    .setFooter({
      text: `configured by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('roles:btn:back')],
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

  const embed = MinaEmbed.warning()
    .setTitle('disable autorole')
    .setDescription(
      'are you sure you want to disable autorole?\n\n' +
        (currentRole
          ? `**current role:** ${currentRole}\n\n`
          : 'autorole is currently disabled.\n\n') +
        'new members will no longer automatically receive a role.'
    )

  const confirmBtn = MinaButtons.custom(
    'roles:btn:autorole_disable_confirm',
    'confirm disable',
    ButtonStyle.Danger
  )

  const cancelBtn = MinaButtons.nah('roles:btn:autorole_cancel')

  const buttonRow = MinaRows.from(confirmBtn, cancelBtn)

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

  const embed = MinaEmbed.success()
    .setTitle('autorole disabled')
    .setDescription(
      'autorole has been disabled successfully.\n\n' +
        'new members will no longer automatically receive a role.'
    )
    .setFooter({
      text: `disabled by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('roles:btn:back')],
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
