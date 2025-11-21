import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'

import config from '@src/config'

const command: CommandData = {
  name: 'roles',
  description: 'Manage roles in bulk - cleanup, create, and configure autorole',
  category: 'ADMIN',
  userPermissions: ['ManageGuild', 'ManageRoles'],
  botPermissions: ['ManageRoles'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild
    if (!guild) {
      await interaction.followUp('This command can only be used in a server.')
      return
    }

    // Show the main roles hub menu
    const embed = new EmbedBuilder()
      .setColor(config.EMBED_COLORS.BOT_EMBED)
      .setTitle('🎭 Roles Management Hub')
      .setDescription(
        'Welcome to the Mina roles management hub! Choose an operation below to get started.\n\n' +
          '**Cleanup** - Bulk delete roles by various criteria\n' +
          '**Create Role** - Create a new role \n' +
          '**Autorole** - Manage automatic role assignment\n' +
          '**Add to User** - Assign roles to users '
      )
      .setFooter({ text: 'Select an operation from the menu below' })

    const menuRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('roles:menu:operation')
          .setPlaceholder('Choose a roles operation')
          .addOptions([
            new StringSelectMenuOptionBuilder()
              .setLabel('Cleanup Roles')
              .setDescription('Bulk delete roles by criteria')
              .setValue('cleanup')
              .setEmoji('🧹'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Create Role')
              .setDescription('Create a new role ')
              .setValue('create')
              .setEmoji('✨'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Autorole')
              .setDescription('Automatic role assignment')
              .setValue('autorole')
              .setEmoji('⚡'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Add to User')
              .setDescription('Assign roles to users ')
              .setValue('add2user')
              .setEmoji('👤'),
          ])
      )

    await interaction.followUp({
      embeds: [embed],
      components: [menuRow],
    })
  },
}

export default command
