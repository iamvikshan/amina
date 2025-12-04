import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js'
import { getSettings, updateSettings } from '@src/database/schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command = {
  name: 'color',
  description: "pick a custom name color from the server's color palette",
  category: 'UTILITY',
  botPermissions: ['ManageRoles'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'set',
        description: 'apply a color role to your name',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'color',
            description: 'color name from the palette',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        name: 'remove',
        description: 'remove your current name color',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'list',
        description: 'show all available color options',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'delete',
        description: 'remove a color from the palette (admin)',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'color name to delete',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    const settings = await getSettings(interaction.guild)
    const colors = settings.colors || []

    // --- DELETE (Admin) ---
    if (subcommand === 'delete') {
      if (
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)
      ) {
        return interaction.reply({
          content: 'You need `Manage Roles` permission to use this command.',
          ephemeral: true,
        })
      }

      const name = interaction.options.getString('name', true)
      const colorIndex = colors.findIndex(
        (c: any) => c.name.toLowerCase() === name.toLowerCase()
      )

      if (colorIndex === -1) {
        return interaction.reply({
          content: `Color **${name}** not found in palette.`,
          ephemeral: true,
        })
      }

      await interaction.deferReply()
      const colorData = colors[colorIndex]

      try {
        // Delete Role
        const role = interaction.guild?.roles.cache.get(colorData.roleId)
        if (role) {
          await role.delete(`Color deleted by ${interaction.user.tag}`)
        }

        // Update DB
        colors.splice(colorIndex, 1)
        if (!interaction.guild) throw new Error('Guild not found')
        await updateSettings(interaction.guild.id, { colors })

        return interaction.editReply({
          content: `Successfully deleted color **${name}** and removed the role.`,
        })
      } catch (err: any) {
        return interaction.editReply(`Failed to delete color: ${err.message}`)
      }
    }

    // --- LIST (User) ---
    if (subcommand === 'list') {
      if (colors.length === 0) {
        return interaction.reply({
          content:
            'No colors available in the palette yet. Ask an admin to add some!',
          ephemeral: true,
        })
      }

      const embed = MinaEmbed.primary()
        .setTitle('available colors')
        .setDescription(
          colors.map((c: any) => `• **${c.name}** (${c.hex})`).join('\n')
        )

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    // --- SET (User) ---
    if (subcommand === 'set') {
      const name = interaction.options.getString('color', true)
      const targetColor = colors.find(
        (c: any) => c.name.toLowerCase() === name.toLowerCase()
      )

      if (!targetColor) {
        return interaction.reply({
          content: `Color **${name}** not found. Use \`/color list\` to see available colors.`,
          ephemeral: true,
        })
      }

      await interaction.deferReply({ ephemeral: true })

      try {
        const member = await interaction.guild?.members.fetch(
          interaction.user.id
        )
        if (!member) throw new Error('Member not found')

        // Remove existing color roles
        const roleIdsToRemove = colors.map((c: any) => c.roleId)
        const rolesToRemove = member.roles.cache.filter(r =>
          roleIdsToRemove.includes(r.id)
        )

        if (rolesToRemove.size > 0) {
          await member.roles.remove(rolesToRemove)
        }

        // Add new role
        const roleToAdd = interaction.guild?.roles.cache.get(targetColor.roleId)
        if (!roleToAdd) {
          // Role might have been deleted manually, try to recreate or error
          // For now, error and suggest admin fix
          return interaction.editReply(
            `The role for **${name}** seems to be missing. Please ask an admin to fix the palette.`
          )
        }

        await member.roles.add(roleToAdd)

        return interaction.editReply({
          content: `Successfully set your color to **${targetColor.name}**!`,
        })
      } catch (err: any) {
        return interaction.editReply(`Failed to set color: ${err.message}`)
      }
    }

    // --- REMOVE (User) ---
    if (subcommand === 'remove') {
      await interaction.deferReply({ ephemeral: true })

      try {
        const member = await interaction.guild?.members.fetch(
          interaction.user.id
        )
        if (!member) throw new Error('Member not found')

        const roleIdsToRemove = colors.map((c: any) => c.roleId)
        const rolesToRemove = member.roles.cache.filter(r =>
          roleIdsToRemove.includes(r.id)
        )

        if (rolesToRemove.size === 0) {
          return interaction.editReply("You don't have any color roles set.")
        }

        await member.roles.remove(rolesToRemove)

        return interaction.editReply('Successfully removed your color role.')
      } catch (err: any) {
        return interaction.editReply(`Failed to remove color: ${err.message}`)
      }
    }

    return interaction.reply({
      content: 'Invalid subcommand.',
      ephemeral: true,
    })
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true)
    const settings = await getSettings(interaction.guild)
    const colors = settings.colors || []

    if (focused.name === 'color' || focused.name === 'name') {
      const filtered = colors.filter((c: any) =>
        c.name.toLowerCase().startsWith(focused.value.toLowerCase())
      )
      await interaction.respond(
        filtered.map((c: any) => ({ name: c.name, value: c.name })).slice(0, 25)
      )
    }
  },
}

export default command
