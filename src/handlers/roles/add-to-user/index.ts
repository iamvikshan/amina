import {
  ButtonInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ButtonStyle,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'

/**
 * Show the add to user menu - starts with user selection
 */
export async function showAddToUserMenu(
  interaction: ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('add roles to users')
    .setDescription('assign roles to multiple users at once.')
    .addFields(
      {
        name: 'process',
        value:
          '1. select users to assign roles to\n2. select roles to assign\n3. review and confirm',
      },
      {
        name: 'notes',
        value:
          '- you can select up to 25 users at once\n' +
          '- only assignable roles will be shown\n' +
          '- users who already have the role will be skipped',
      }
    )
    .setFooter({ text: 'select users to begin' })

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

  await interaction.update({
    embeds: [embed],
    components: [
      userSelectRow,
      MinaRows.single(MinaButtons.nah('roles:btn:back')),
    ],
  })
}

/**
 * Handle user selection - show role selector
 */
export async function handleUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  const selectedUsers = interaction.values
  const guild = interaction.guild
  if (!guild) {
    await interaction.reply({
      content: 'This command must be used in a server (guild).',
      ephemeral: true,
    })
    return
  }

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
        'no assignable roles found. make sure the bot has a higher role than the roles you want to assign.',
      embeds: [],
      components: [MinaRows.backRow('roles:btn:back')],
    })
    return
  }

  // Encode user IDs in custom_id
  const userDataB64 = Buffer.from(JSON.stringify(selectedUsers)).toString(
    'base64'
  )

  const embed = MinaEmbed.primary()
    .setTitle('select roles')
    .setDescription(
      `adding roles to **${selectedUsers.length}** user${selectedUsers.length > 1 ? 's' : ''}`
    )
    .addFields(
      {
        name: 'selected users',
        value: selectedUsers.map(id => `<@${id}>`).join(', '),
      },
      {
        name: 'next step',
        value: 'select the roles you want to assign to these users',
      }
    )
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

  await interaction.update({
    embeds: [embed],
    components: [
      roleSelectRow,
      MinaRows.single(MinaButtons.nah('roles:btn:back')),
    ],
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

  const guild = interaction.guild
  if (!guild) {
    await interaction.reply({
      content: 'This command must be used in a server (guild).',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  // Get full Role objects from guild cache
  const roles = selectedRoleIds
    .map(id => guild.roles.cache.get(id))
    .filter((role): role is NonNullable<typeof role> => role !== undefined)

  if (roles.length === 0) {
    await interaction.editReply({
      content: 'failed to fetch selected roles.',
      embeds: [],
      components: [MinaRows.backRow('roles:btn:back')],
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
  const embed = MinaEmbed.warning()
    .setTitle('assignment preview')
    .setDescription(`review the role assignment before confirming`)
    .addFields(
      {
        name: 'statistics',
        value:
          `**users**: ${stats.totalUsers}\n` +
          `**roles**: ${stats.totalRoles}\n` +
          `**new assignments**: ${stats.totalOperations}\n` +
          `**already has**: ${stats.skipped}`,
        inline: false,
      },
      {
        name: 'roles to assign',
        value: roles.map(r => `${r}`).join(', '),
        inline: false,
      }
    )
    .setFooter({ text: 'confirm to proceed with assignment' })

  // Add user breakdown (max 5 users shown)
  const previewUsers = userStatus.slice(0, 5)
  for (const { userId, willReceive, alreadyHas } of previewUsers) {
    const statusText: string[] = []
    if (willReceive.length > 0)
      statusText.push(`will receive: ${willReceive.join(', ')}`)
    if (alreadyHas.length > 0)
      statusText.push(`already has: ${alreadyHas.join(', ')}`)

    embed.addFields({
      name: `<@${userId}>`,
      value: statusText.join('\n') || 'already has all roles',
      inline: false,
    })
  }

  if (userStatus.length > 5) {
    embed.addFields({
      name: 'more users',
      value: `... and ${userStatus.length - 5} more users`,
      inline: false,
    })
  }

  if (stats.totalOperations === 0) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.primary()
          .setTitle('no changes needed')
          .setDescription(
            'all selected users already have all selected roles.'
          ),
      ],
      components: [MinaRows.backRow('roles:btn:back')],
    })
    return
  }

  // Encode assignment data
  const assignmentData = { userIds, roleIds: selectedRoleIds }
  const assignmentDataB64 = Buffer.from(
    JSON.stringify(assignmentData)
  ).toString('base64')

  const confirmBtn = MinaButtons.custom(
    `roles:btn:assign_confirm|${assignmentDataB64}`,
    `confirm (${stats.totalOperations} assignments)`,
    ButtonStyle.Success
  )
  const cancelBtn = MinaButtons.nah('roles:btn:back')

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.from(confirmBtn, cancelBtn)],
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

  const guild = interaction.guild
  if (!guild) {
    await interaction.deferUpdate()
    await interaction.editReply({
      embeds: [
        MinaEmbed.error().setDescription(
          'This command must be used in a guild.'
        ),
      ],
      components: [],
    })
    return
  }

  await interaction.deferUpdate()
  const roles = roleIds
    .map((id: string) => guild.roles.cache.get(id))
    .filter((role: any): role is NonNullable<typeof role> => role !== undefined)

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
  const embed = (successCount > 0 ? MinaEmbed.success() : MinaEmbed.error())
    .setTitle(successCount > 0 ? 'assignment complete' : 'assignment failed')
    .setDescription(`processed ${userIds.length} users`)
    .addFields(
      {
        name: 'results',
        value: `successful: ${successCount}\nfailed: ${failCount}`,
      },
      {
        name: 'roles assigned',
        value: roles.map((r: any) => `${r}`).join(', '),
      }
    )

  if (errors.length > 0) {
    embed.addFields({
      name: 'errors',
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
