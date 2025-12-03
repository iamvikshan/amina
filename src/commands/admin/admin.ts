import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'admin',
  description: 'Admin hub - Configure server settings, Mina AI, and logging',
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
          .setPlaceholder('Choose an admin category')
          .addOptions([
            new StringSelectMenuOptionBuilder()
              .setLabel('Server Settings')
              .setDescription('Updates channel and staff roles')
              .setValue('settings')
              .setEmoji('🔧'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Mina AI')
              .setDescription('Configure AI responses')
              .setValue('minaai')
              .setEmoji('🤖'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Logging')
              .setDescription('Moderation logs configuration')
              .setValue('logs')
              .setEmoji('📋'),
            new StringSelectMenuOptionBuilder()
              .setLabel('View Status')
              .setDescription('See all current settings')
              .setValue('status')
              .setEmoji('📊'),
          ])
      )

    await interaction.followUp({
      embeds: [embed],
      components: [menuRow],
    })
  },
}

export default command
