import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { getSettings, updateSettings } from '@src/database/schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Handle adding a new color to the server palette
 * Requires ManageRoles permission
 */
export async function handleAddColor(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  // Guild check
  if (!interaction.guild) {
    await interaction.reply({
      content: 'this command can only be used in a server.',
      ephemeral: true,
    })
    return
  }

  // User permission check
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply({
      content: 'you need `Manage Roles` permission to use this command.',
      ephemeral: true,
    })
    return
  }

  // Bot permission check
  const botMember = interaction.guild.members.me
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply({
      content: 'i need `Manage Roles` permission to create color roles.',
      ephemeral: true,
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const colors = settings.colors || []

  const name = interaction.options.getString('name', true)
  let hex = interaction.options.getString('hex', true)

  // Validate Hex
  if (!hex.startsWith('#')) hex = `#${hex}`
  const hexRegex = /^#([0-9A-F]{3}){1,2}$/i
  if (!hexRegex.test(hex)) {
    await interaction.reply({
      content: 'invalid hex code. use format like `#FF0000` or `FF0000`.',
      ephemeral: true,
    })
    return
  }

  // Check if exists
  if (colors.find((c: any) => c.name.toLowerCase() === name.toLowerCase())) {
    await interaction.reply({
      content: `a color with the name **${name}** already exists.`,
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply()

  try {
    // Create Role
    const role = await interaction.guild.roles.create({
      name: name,
      color: hex as `#${string}`,
      reason: `Color role created by ${interaction.user.tag}`,
    })

    if (!role) throw new Error('Failed to create role')

    // Save to DB
    colors.push({
      name: name,
      hex: hex,
      roleId: role.id,
    })
    await updateSettings(interaction.guild.id, { colors })

    const embed = MinaEmbed.success().setDescription(
      `successfully added color **${name}** (${hex}) and created role ${role.toString()}`
    )

    await interaction.editReply({ embeds: [embed] })
  } catch (err: any) {
    await interaction.editReply(`failed to add color: ${err.message}`)
  }
}

export default 0
