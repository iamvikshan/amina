import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings } from '@schemas/Guild'
import { handleAdminBackButton } from '../main-hub'

/**
 * Show Server Settings submenu
 */
export async function showServerSettingsMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild)

  const updatesChannel = settings.server.updates_channel
    ? `<#${settings.server.updates_channel}>`
    : 'Not set'
  const staffRoles =
    settings.server.staff_roles.length > 0
      ? settings.server.staff_roles.map((r: string) => `<@&${r}>`).join(', ')
      : 'None'

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🔧 Server Settings')
    .setDescription(
      'Manage server-wide settings for Mina.\n\n' +
        `**Updates Channel:** ${updatesChannel}\n` +
        `**Staff Roles:** ${staffRoles}`
    )
    .setFooter({ text: 'Select an action from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:settings')
      .setPlaceholder('Choose a setting to configure')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Updates Channel')
          .setDescription('Choose where bot updates are posted')
          .setValue('updateschannel')
          .setEmoji('📢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Add Staff Role')
          .setDescription('Add a role to the staff list')
          .setValue('staffadd')
          .setEmoji('➕'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Remove Staff Role')
          .setDescription('Remove a role from the staff list')
          .setValue('staffremove')
          .setEmoji('➖'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Back to Main Menu')
          .setDescription('Return to admin hub')
          .setValue('back')
          .setEmoji('◀️'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}

/**
 * Handle Server Settings action selection
 */
export async function handleServerSettingsMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]

  if (action === 'back') {
    await interaction.deferUpdate()
    await handleAdminBackButton(interaction as any)
    return
  }

  await interaction.deferUpdate()

  switch (action) {
    case 'updateschannel':
      await showChannelSelector(interaction, 'updateschannel')
      break
    case 'staffadd':
      await showRoleSelector(interaction, 'staffadd')
      break
    case 'staffremove':
      await showRoleSelector(interaction, 'staffremove')
      break
    default:
      await interaction.followUp({
        content: '❌ Invalid action selected',
        ephemeral: true,
      })
  }
}

/**
 * Show channel selector for updates channel
 */
async function showChannelSelector(
  interaction: StringSelectMenuInteraction,
  action: string
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('📢 Select Updates Channel')
    .setDescription(
      'Choose a channel where Mina will post bot updates and announcements.\n\n' +
        '**Requirements:**\n' +
        '• Must be a text or announcement channel\n' +
        '• Mina must have permission to send messages'
    )

  const channelSelectRow =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`admin:channel:${action}`)
        .setPlaceholder('Select a channel')
        .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement])
    )

  await interaction.editReply({
    embeds: [embed],
    components: [channelSelectRow],
  })
}

/**
 * Show role selector for staff roles
 */
async function showRoleSelector(
  interaction: StringSelectMenuInteraction,
  action: string
): Promise<void> {
  const isAdding = action === 'staffadd'
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle(isAdding ? '➕ Add Staff Role' : '➖ Remove Staff Role')
    .setDescription(
      isAdding
        ? 'Select a role to add to the staff list. Staff roles have access to certain moderation features.\n\n' +
            '**Note:** You can have up to 5 staff roles.'
        : 'Select a role to remove from the staff list.'
    )

  const roleSelectRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`admin:role:${action}`)
        .setPlaceholder('Select a role')
    )

  await interaction.editReply({
    embeds: [embed],
    components: [roleSelectRow],
  })
}
