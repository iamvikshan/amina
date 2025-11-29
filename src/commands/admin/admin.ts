import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import config from '@src/config'

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
    const embed = new EmbedBuilder()
      .setColor(config.EMBED_COLORS.BOT_EMBED)
      .setTitle('⚙️ Admin Hub')
      .setDescription(
        'Welcome to the Mina admin hub! Choose a category below to get started.\n\n' +
          '**Server Settings** - Manage updates channel and staff roles\n' +
          '**Mina AI** - Configure AI responses and behavior\n' +
          '**Logging** - Set up moderation logs\n' +
          '**Status** - View current configuration'
      )
      .setFooter({ text: 'Select a category from the menu below' })

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
