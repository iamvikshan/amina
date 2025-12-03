import {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  MessageFlags,
  ButtonStyle,
} from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show the create role menu
 */
export async function showCreateRoleMenu(
  interaction: ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('create new role')
    .setDescription('configure a new role for your server.')
    .addFields(
      {
        name: 'setup process',
        value:
          '1. provide a role name and color\n' +
          '2. (optional) configure permissions\n' +
          '3. review and create',
      },
      {
        name: 'options',
        value:
          '**basic** - name and color only\n**advanced** - include permission configuration',
      }
    )
    .setFooter({ text: 'select an option to begin' })

  const buttons = MinaRows.from(
    MinaButtons.custom(
      'roles:btn:create_basic',
      'basic setup',
      ButtonStyle.Primary
    ),
    MinaButtons.custom(
      'roles:btn:create_advanced',
      'advanced setup',
      ButtonStyle.Secondary
    ),
    MinaButtons.custom('roles:btn:back', 'cancel', ButtonStyle.Danger)
  )

  await interaction.update({
    embeds: [embed],
    components: [buttons],
  })
}

/**
 * Show the basic create role modal (name and color)
 */
export async function showCreateRoleModal(
  interaction: ButtonInteraction,
  advanced: boolean = false
): Promise<void> {
  const modal = {
    title: advanced ? 'create role - advanced' : 'create role - basic',
    custom_id: `roles:modal:create|${advanced ? 'advanced' : 'basic'}`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: 'name',
            label: 'role name',
            style: 1,
            placeholder: 'enter role name...',
            required: true,
            max_length: 100,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: 'color',
            label: 'role color (hex)',
            style: 1,
            placeholder: '#5865F2 or 5865F2',
            required: false,
            max_length: 7,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: 'reason',
            label: 'reason (audit log)',
            style: 1,
            placeholder: 'optional reason for creating this role...',
            required: false,
            max_length: 200,
          },
        ],
      },
    ],
  }

  await interaction.showModal(modal)
}

/**
 * Handle create role modal submission
 */
export async function handleCreateRoleModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const [, mode] = interaction.customId.split('|')
  const advanced = mode === 'advanced'

  const name = interaction.fields.getTextInputValue('name').trim()
  const colorInput = interaction.fields.getTextInputValue('color').trim()
  const reason =
    interaction.fields.getTextInputValue('reason').trim() ||
    'Created via /roles'

  // Validate and parse color
  let color: number | undefined
  if (colorInput) {
    const hexMatch = colorInput.match(/^#?([0-9A-Fa-f]{6})$/)
    if (!hexMatch) {
      await interaction.reply({
        content:
          'invalid color format. use hex format like `#5865F2` or `5865F2`',
        flags: MessageFlags.Ephemeral,
      })
      return
    }
    color = parseInt(hexMatch[1], 16)
  }

  // Check if role name already exists
  const guild = interaction.guild!
  const existingRole = guild.roles.cache.find(
    r => r.name.toLowerCase() === name.toLowerCase()
  )
  if (existingRole) {
    await interaction.reply({
      content: `a role named **${name}** already exists.`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // For basic mode, create immediately
  if (!advanced) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
      const newRole = await guild.roles.create({
        name,
        color,
        reason,
      })

      const embed = MinaEmbed.success()
        .setTitle('role created')
        .setDescription(`successfully created role ${newRole}`)
        .addFields(
          {
            name: 'name',
            value: newRole.name,
            inline: true,
          },
          {
            name: 'color',
            value: newRole.hexColor,
            inline: true,
          },
          {
            name: 'position',
            value: `${newRole.position}`,
            inline: true,
          }
        )
        .setFooter({ text: 'use /roles to configure autorole or manage roles' })

      if (color) {
        embed.setColor(color)
      }

      await interaction.editReply({
        embeds: [embed],
      })
    } catch (error: any) {
      await interaction.editReply({
        content: `failed to create role: ${error.message}`,
      })
    }
    return
  }

  // For advanced mode, show permission selector
  await showPermissionSelector(interaction, name, color, reason)
}

/**
 * Show permission selection menu for advanced role creation
 */
async function showPermissionSelector(
  interaction: ModalSubmitInteraction,
  name: string,
  color: number | undefined,
  reason: string
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('configure permissions')
    .setDescription(`setting up role: **${name}**`)
    .addFields({
      name: 'common permission sets',
      value:
        '**admin** - full server permissions\n' +
        '**moderator** - manage messages, kick, ban, timeout\n' +
        '**support** - manage messages, view audit log\n' +
        '**none** - no special permissions',
    })
    .setFooter({ text: 'select a permission preset' })

  if (color) {
    embed.setColor(color)
  }

  // Encode role data in custom_id
  const roleData = Buffer.from(
    JSON.stringify({ name, color, reason })
  ).toString('base64')

  const row = {
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `roles:menu:perms|${roleData}`,
        placeholder: 'select permission preset...',
        options: [
          {
            label: 'administrator',
            value: 'admin',
            description: 'full server permissions',
          },
          {
            label: 'moderator',
            value: 'moderator',
            description: 'manage messages, members, and channels',
          },
          {
            label: 'support',
            value: 'support',
            description: 'manage messages and view logs',
          },
          {
            label: 'none',
            value: 'none',
            description: 'no special permissions',
          },
        ],
      },
    ],
  }

  await interaction.reply({
    embeds: [embed],
    components: [row, MinaRows.single(MinaButtons.nah('roles:btn:back'))],
    flags: MessageFlags.Ephemeral,
  })
}

/**
 * Handle permission selection and create role
 */
export async function handlePermissionSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const [, roleDataB64] = interaction.customId.split('|')
  const roleData = JSON.parse(Buffer.from(roleDataB64, 'base64').toString())
  const { name, color, reason } = roleData
  const permissionSet = interaction.values[0]

  await interaction.deferUpdate()

  const guild = interaction.guild!

  // Map permission sets
  let permissionArray: bigint[] = []

  switch (permissionSet) {
    case 'admin':
      permissionArray = [1n << 3n] // Administrator
      break
    case 'moderator':
      permissionArray = [
        1n << 1n, // KickMembers
        1n << 2n, // BanMembers
        1n << 13n, // ManageMessages
        1n << 4n, // ManageChannels
        1n << 40n, // ModerateMembers
        1n << 7n, // ViewAuditLog
      ]
      break
    case 'support':
      permissionArray = [
        1n << 13n, // ManageMessages
        1n << 7n, // ViewAuditLog
      ]
      break
    case 'none':
    default:
      // No permissions
      break
  }

  // Combine permissions into single bigint
  const combinedPermissions = permissionArray.reduce(
    (acc, val) => acc | val,
    0n
  )

  try {
    const newRole = await guild.roles.create({
      name,
      color,
      permissions: combinedPermissions,
      reason,
    })

    const embed = MinaEmbed.success()
      .setTitle('role created')
      .setDescription(`successfully created role ${newRole}`)
      .addFields(
        {
          name: 'name',
          value: newRole.name,
          inline: true,
        },
        {
          name: 'color',
          value: newRole.hexColor,
          inline: true,
        },
        {
          name: 'position',
          value: `${newRole.position}`,
          inline: true,
        },
        {
          name: 'permissions',
          value:
            permissionSet === 'none'
              ? 'none'
              : permissionSet.charAt(0).toUpperCase() + permissionSet.slice(1),
        }
      )
      .setFooter({ text: 'use /roles to configure autorole or manage roles' })

    if (color) {
      embed.setColor(color)
    }

    await interaction.editReply({
      embeds: [embed],
      components: [],
    })
  } catch (error: any) {
    await interaction.editReply({
      content: `failed to create role: ${error.message}`,
      components: [],
    })
  }
}
