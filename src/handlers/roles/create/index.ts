import {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import {
  createPrimaryBtn,
  createSecondaryBtn,
  createDangerBtn,
} from '@helpers/componentHelper'

/**
 * Show the create role menu
 */
export async function showCreateRoleMenu(
  interaction: ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('🎨 Create New Role')
    .setDescription('Configure a new role for your server.')
    .addFields(
      {
        name: '📝 Setup Process',
        value:
          '1️⃣ Provide a role name and color\n' +
          '2️⃣ (Optional) Configure permissions\n' +
          '3️⃣ Review and create',
      },
      {
        name: '⚙️ Options',
        value:
          '**Basic** - Name and color only\n**Advanced** - Include permission configuration',
      }
    )
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setFooter({ text: 'Select an option to begin' })

  const row1 = createPrimaryBtn({
    label: 'Basic Setup',
    customId: 'roles:btn:create_basic',
  })
  const row2 = createSecondaryBtn({
    label: 'Advanced Setup',
    customId: 'roles:btn:create_advanced',
  })
  const row3 = createDangerBtn({ label: 'Cancel', customId: 'roles:btn:back' })

  await interaction.update({
    embeds: [embed],
    components: [row1, row2, row3],
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
    title: advanced ? 'Create Role - Advanced' : 'Create Role - Basic',
    custom_id: `roles:modal:create|${advanced ? 'advanced' : 'basic'}`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: 'name',
            label: 'Role Name',
            style: 1,
            placeholder: 'Enter role name...',
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
            label: 'Role Color (Hex)',
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
            label: 'Reason (Audit Log)',
            style: 1,
            placeholder: 'Optional reason for creating this role...',
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
          '❌ Invalid color format. Use hex format like `#5865F2` or `5865F2`',
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
      content: `❌ A role named **${name}** already exists.`,
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

      const embed = new EmbedBuilder()
        .setTitle('✅ Role Created')
        .setDescription(`Successfully created role ${newRole}`)
        .addFields(
          {
            name: 'Name',
            value: newRole.name,
            inline: true,
          },
          {
            name: 'Color',
            value: newRole.hexColor,
            inline: true,
          },
          {
            name: 'Position',
            value: `${newRole.position}`,
            inline: true,
          }
        )
        .setColor(color || EMBED_COLORS.SUCCESS)
        .setFooter({ text: 'Use /roles to configure autorole or manage roles' })

      await interaction.editReply({
        embeds: [embed],
      })
    } catch (error: any) {
      await interaction.editReply({
        content: `❌ Failed to create role: ${error.message}`,
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
  const embed = new EmbedBuilder()
    .setTitle('🔐 Configure Permissions')
    .setDescription(`Setting up role: **${name}**`)
    .addFields({
      name: '📋 Common Permission Sets',
      value:
        '**Admin** - Full server permissions\n' +
        '**Moderator** - Manage messages, kick, ban, timeout\n' +
        '**Support** - Manage messages, view audit log\n' +
        '**None** - No special permissions',
    })
    .setColor(color || EMBED_COLORS.BOT_EMBED)
    .setFooter({ text: 'Select a permission preset' })

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
        placeholder: 'Select permission preset...',
        options: [
          {
            label: 'Administrator',
            value: 'admin',
            description: 'Full server permissions',
            emoji: '👑',
          },
          {
            label: 'Moderator',
            value: 'moderator',
            description: 'Manage messages, members, and channels',
            emoji: '🛡️',
          },
          {
            label: 'Support',
            value: 'support',
            description: 'Manage messages and view logs',
            emoji: '🎫',
          },
          {
            label: 'None',
            value: 'none',
            description: 'No special permissions',
            emoji: '📝',
          },
        ],
      },
    ],
  }

  const buttonRow = createDangerBtn({
    label: 'Cancel',
    customId: 'roles:btn:back',
  })

  await interaction.reply({
    embeds: [embed],
    components: [row, buttonRow],
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

    const embed = new EmbedBuilder()
      .setTitle('✅ Role Created')
      .setDescription(`Successfully created role ${newRole}`)
      .addFields(
        {
          name: 'Name',
          value: newRole.name,
          inline: true,
        },
        {
          name: 'Color',
          value: newRole.hexColor,
          inline: true,
        },
        {
          name: 'Position',
          value: `${newRole.position}`,
          inline: true,
        },
        {
          name: 'Permissions',
          value:
            permissionSet === 'none'
              ? 'None'
              : permissionSet.charAt(0).toUpperCase() + permissionSet.slice(1),
        }
      )
      .setColor(color || EMBED_COLORS.SUCCESS)
      .setFooter({ text: 'Use /roles to configure autorole or manage roles' })

    await interaction.editReply({
      embeds: [embed],
      components: [],
    })
  } catch (error: any) {
    await interaction.editReply({
      content: `❌ Failed to create role: ${error.message}`,
      components: [],
    })
  }
}
