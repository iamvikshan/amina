import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'

import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

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
      await interaction.followUp(mina.say('serverOnly'))
      return
    }

    // Show the main roles hub menu
    const embed = MinaEmbed.primary()
      .setTitle(mina.say('roles.hub.title'))
      .setDescription(mina.say('roles.hub.description'))
      .setFooter({ text: mina.say('roles.hub.footer') })

    const menuRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('roles:menu:operation')
          .setPlaceholder(mina.say('roles.hub.placeholder'))
          .addOptions([
            new StringSelectMenuOptionBuilder()
              .setLabel(mina.say('roles.options.cleanup.label'))
              .setDescription(mina.say('roles.options.cleanup.description'))
              .setValue('cleanup'),
            new StringSelectMenuOptionBuilder()
              .setLabel(mina.say('roles.options.create.label'))
              .setDescription(mina.say('roles.options.create.description'))
              .setValue('create'),
            new StringSelectMenuOptionBuilder()
              .setLabel(mina.say('roles.options.autorole.label'))
              .setDescription(mina.say('roles.options.autorole.description'))
              .setValue('autorole'),
            new StringSelectMenuOptionBuilder()
              .setLabel(mina.say('roles.options.add2user.label'))
              .setDescription(mina.say('roles.options.add2user.description'))
              .setValue('add2user'),
          ])
      )

    await interaction.followUp({
      embeds: [embed],
      components: [menuRow],
    })
  },
}

export default command
