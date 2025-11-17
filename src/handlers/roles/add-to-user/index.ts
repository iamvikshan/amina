import {
  ButtonInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  EmbedBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import {
  createSecondaryBtn,
  createSuccessBtn,
  createDangerBtn,
} from '@helpers/componentHelper'

/**
 * Show the add to user menu - starts with user selection
 */
export async function showAddToUserMenu(
  interaction: ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('👥 Add Roles to Users')
    .setDescription('Assign roles to multiple users at once.')
    .addFields(
      {
        name: '📋 Process',
        value:
          '1️⃣ Select users to assign roles to\n2️⃣ Select roles to assign\n3️⃣ Review and confirm',
      },
      {
        name: '⚠️ Notes',
        value:
          '• You can select up to 25 users at once\n' +
          '• Only assignable roles will be shown\n' +
          '• Users who already have the role will be skipped',
      }
    )
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setFooter({ text: 'Select users to begin' })

  const userSelectRow = {
    type: 1,
    components: [
      {
        type: 5, // UserSelect
        custom_id: 'roles:user:select',
        placeholder: 'Select users...',
        min_values: 1,
        max_values: 25,
      },
    ],
  }

  const buttonRow = createDangerBtn({
    label: 'Cancel',
    customId: 'roles:btn:back',
  })

  await interaction.update({
    embeds: [embed],
    components: [userSelectRow, buttonRow],
  })
}

/**
 * Handle user selection - show role selector
 */
export async function handleUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  const selectedUsers = interaction.values
  const guild = interaction.guild!

  // Get assignable roles (below bot's highest role, not @everyone, not managed)
  const botMember = await guild.members.fetchMe()
  const botHighestRole = botMember.roles.highest
  const assignableRoles = guild.roles.cache.filter(
    role =>
      role.id !== guild.id && // Not @everyone
      !role.managed && // Not managed by integration
      role.position < botHighestRole.position // Below bot's highest role
  )

  if (assignableRoles.size === 0) {
    await interaction.update({
      content:
        '❌ No assignable roles found. Make sure the bot has a higher role than the roles you want to assign.',
      embeds: [],
      components: [
        createSecondaryBtn({ label: 'Back', customId: 'roles:btn:back' }),
      ],
    })
    return
  }

  // Encode user IDs in custom_id
  const userDataB64 = Buffer.from(JSON.stringify(selectedUsers)).toString(
    'base64'
  )

  const embed = new EmbedBuilder()
    .setTitle('🎭 Select Roles')
    .setDescription(
      `Adding roles to **${selectedUsers.length}** user${selectedUsers.length > 1 ? 's' : ''}`
    )
    .addFields(
      {
        name: '👥 Selected Users',
        value: selectedUsers.map(id => `<@${id}>`).join(', '),
      },
      {
        name: '📝 Next Step',
        value: 'Select the roles you want to assign to these users',
      }
    )
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setFooter({ text: `${assignableRoles.size} assignable roles available` })

  const roleSelectRow = {
    type: 1,
    components: [
      {
        type: 6, // RoleSelect
        custom_id: `roles:role:assign|${userDataB64}`,
        placeholder: 'Select roles to assign...',
        min_values: 1,
        max_values: Math.min(25, assignableRoles.size),
      },
    ],
  }

  const buttonRow = createDangerBtn({
    label: 'Cancel',
    customId: 'roles:btn:back',
  })

  await interaction.update({
    embeds: [embed],
    components: [roleSelectRow, buttonRow],
  })
}

/**
 * Handle role selection - show preview
 */
export async function handleRoleSelect(
  interaction: RoleSelectMenuInteraction
): Promise<void> {
  const [, userDataB64] = interaction.customId.split('|')
  const userIds: string[] = JSON.parse(
    Buffer.from(userDataB64, 'base64').toString()
  )
  const selectedRoleIds = interaction.values

  await interaction.deferUpdate()

  const guild = interaction.guild!

  // Get full Role objects from guild cache
  const roles = selectedRoleIds
    .map(id => guild.roles.cache.get(id))
    .filter((role): role is NonNullable<typeof role> => role !== undefined)

  if (roles.length === 0) {
    await interaction.editReply({
      content: '❌ Failed to fetch selected roles.',
      embeds: [],
      components: [
        createSecondaryBtn({ label: 'Back', customId: 'roles:btn:back' }),
      ],
    })
    return
  }

  // Analyze what will happen
  const stats = {
    totalUsers: userIds.length,
    totalRoles: roles.length,
    totalOperations: 0,
    skipped: 0,
  }

  const userStatus: {
    userId: string
    willReceive: string[]
    alreadyHas: string[]
  }[] = []

  for (const userId of userIds) {
    const member = await guild.members.fetch(userId).catch(() => null)
    if (!member) continue

    const willReceive: string[] = []
    const alreadyHas: string[] = []

    for (const role of roles) {
      if (member.roles.cache.has(role.id)) {
        alreadyHas.push(role.name)
        stats.skipped++
      } else {
        willReceive.push(role.name)
        stats.totalOperations++
      }
    }

    userStatus.push({ userId, willReceive, alreadyHas })
  }

  // Show preview
  const embed = new EmbedBuilder()
    .setTitle('📊 Assignment Preview')
    .setDescription(`Review the role assignment before confirming`)
    .addFields(
      {
        name: '📈 Statistics',
        value:
          `**Users**: ${stats.totalUsers}\n` +
          `**Roles**: ${stats.totalRoles}\n` +
          `**New Assignments**: ${stats.totalOperations}\n` +
          `**Already Has**: ${stats.skipped}`,
        inline: false,
      },
      {
        name: '🎭 Roles to Assign',
        value: roles.map(r => `${r}`).join(', '),
        inline: false,
      }
    )
    .setColor(EMBED_COLORS.WARNING)
    .setFooter({ text: 'Confirm to proceed with assignment' })

  // Add user breakdown (max 5 users shown)
  const previewUsers = userStatus.slice(0, 5)
  for (const { userId, willReceive, alreadyHas } of previewUsers) {
    const statusText: string[] = []
    if (willReceive.length > 0)
      statusText.push(`✅ Will receive: ${willReceive.join(', ')}`)
    if (alreadyHas.length > 0)
      statusText.push(`⏭️ Already has: ${alreadyHas.join(', ')}`)

    embed.addFields({
      name: `👤 <@${userId}>`,
      value: statusText.join('\n') || '⏭️ Already has all roles',
      inline: false,
    })
  }

  if (userStatus.length > 5) {
    embed.addFields({
      name: '📋 More Users',
      value: `... and ${userStatus.length - 5} more users`,
      inline: false,
    })
  }

  if (stats.totalOperations === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('ℹ️ No Changes Needed')
          .setDescription('All selected users already have all selected roles.')
          .setColor(EMBED_COLORS.BOT_EMBED),
      ],
      components: [
        createSecondaryBtn({ label: 'Back', customId: 'roles:btn:back' }),
      ],
    })
    return
  }

  // Encode assignment data
  const assignmentData = { userIds, roleIds: selectedRoleIds }
  const assignmentDataB64 = Buffer.from(
    JSON.stringify(assignmentData)
  ).toString('base64')

  const confirmBtn = createSuccessBtn({
    label: `Confirm (${stats.totalOperations} assignments)`,
    customId: `roles:btn:assign_confirm|${assignmentDataB64}`,
  })
  const cancelBtn = createDangerBtn({
    label: 'Cancel',
    customId: 'roles:btn:back',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [confirmBtn, cancelBtn],
  })
}

/**
 * Execute role assignment
 */
export async function handleAssignConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  const [, assignmentDataB64] = interaction.customId.split('|')
  const { userIds, roleIds } = JSON.parse(
    Buffer.from(assignmentDataB64, 'base64').toString()
  )

  await interaction.deferUpdate()

  const guild = interaction.guild!
  const roles = roleIds
    .map((id: string) => guild.roles.cache.get(id))
    .filter((role): role is NonNullable<typeof role> => role !== undefined)

  let successCount = 0
  let failCount = 0
  const errors: string[] = []

  for (const userId of userIds) {
    const member = await guild.members.fetch(userId).catch(() => null)
    if (!member) {
      failCount++
      errors.push(`Failed to fetch user <@${userId}>`)
      continue
    }

    try {
      await member.roles.add(
        roles,
        `Bulk role assignment by ${interaction.user.tag}`
      )
      successCount++
    } catch (error: any) {
      failCount++
      errors.push(`<@${userId}>: ${error.message}`)
    }
  }

  // Show results
  const embed = new EmbedBuilder()
    .setTitle(
      successCount > 0 ? '✅ Assignment Complete' : '❌ Assignment Failed'
    )
    .setDescription(`Processed ${userIds.length} users`)
    .addFields(
      {
        name: '📊 Results',
        value: `✅ Successful: ${successCount}\n❌ Failed: ${failCount}`,
      },
      {
        name: '🎭 Roles Assigned',
        value: roles.map(r => `${r}`).join(', '),
      }
    )
    .setColor(successCount > 0 ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)

  if (errors.length > 0) {
    embed.addFields({
      name: '❌ Errors',
      value:
        errors.slice(0, 5).join('\n') +
        (errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''),
    })
  }

  await interaction.editReply({
    embeds: [embed],
    components: [],
  })
}
