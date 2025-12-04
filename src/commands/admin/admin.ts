import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'admin',
  description: 'central hub for server configuration, ai settings, and logging',
  category: 'ADMIN',
  userPermissions: ['ManageGuild'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction, _data: any) {
    // Show main admin hub menu
    const embed = MinaEmbed.primary()
      .setTitle('admin hub')
      .setDescription(
        'welcome to the mina admin hub! choose a category below to get started.\n\n' +
          '**server settings** - manage updates channel and staff roles\n' +
          '**mina ai** - configure ai responses and behavior\n' +
          '**logging** - set up moderation logs\n' +
          '**status** - view current configuration'
      )
      .setFooter({ text: 'select a category from the menu below' })

    const menuRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('admin:menu:category')
          .setPlaceholder('choose an admin category')
          .addOptions([
            new StringSelectMenuOptionBuilder()
              .setLabel('server settings')
              .setDescription('updates channel and staff roles')
              .setValue('settings'),
            new StringSelectMenuOptionBuilder()
              .setLabel('mina ai')
              .setDescription('configure ai responses')
              .setValue('minaai'),
            new StringSelectMenuOptionBuilder()
              .setLabel('logging')
              .setDescription('moderation logs configuration')
              .setValue('logs'),
            new StringSelectMenuOptionBuilder()
              .setLabel('view status')
              .setDescription('see all current settings')
              .setValue('status'),
          ])
      )

    await interaction.followUp({
      embeds: [embed],
      components: [menuRow],
    })
  },
}

export default command
