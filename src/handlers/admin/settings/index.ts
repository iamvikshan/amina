import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { handleAdminBackButton } from '../main-hub'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show Server Settings submenu
 */
export async function showServerSettingsMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild)

  const updatesChannel = settings.server.updates_channel
    ? `<#${settings.server.updates_channel}>`
    : 'not set'
  const staffRoles =
    settings.server.staff_roles.length > 0
      ? settings.server.staff_roles.map((r: string) => `<@&${r}>`).join(', ')
      : 'None'

  const embed = MinaEmbed.primary()
    .setTitle('server settings')
    .setDescription(
      'manage server-wide settings for mina.\n\n' +
        `**updates channel:** ${updatesChannel}\n` +
        `**staff roles:** ${staffRoles}`
    )
    .setFooter({ text: 'select an action from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:settings')
      .setPlaceholder('choose a setting to configure')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('set updates channel')
          .setDescription('choose where bot updates are posted')
          .setValue('updateschannel'),
        new StringSelectMenuOptionBuilder()
          .setLabel('add staff role')
          .setDescription('add a role to the staff list')
          .setValue('staffadd'),
        new StringSelectMenuOptionBuilder()
          .setLabel('remove staff role')
          .setDescription('remove a role from the staff list')
          .setValue('staffremove'),
        new StringSelectMenuOptionBuilder()
          .setLabel('back to main menu')
          .setDescription('return to admin hub')
          .setValue('back'),
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
  const embed = MinaEmbed.primary()
    .setTitle('select updates channel')
    .setDescription(
      'choose a channel where mina will post bot updates and announcements.\n\n' +
        '**requirements:**\n' +
        '- must be a text or announcement channel\n' +
        '- mina must have permission to send messages'
    )

  const channelSelectRow =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`admin:channel:${action}`)
        .setPlaceholder('select a channel')
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
  const embed = MinaEmbed.primary()
    .setTitle(isAdding ? 'add staff role' : 'remove staff role')
    .setDescription(
      isAdding
        ? 'select a role to add to the staff list. staff roles have access to certain moderation features.\n\n' +
            '**note:** you can have up to 5 staff roles'
        : 'select a role to remove from the staff list'
    )

  const roleSelectRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`admin:role:${action}`)
        .setPlaceholder('select a role')
    )

  await interaction.editReply({
    embeds: [embed],
    components: [roleSelectRow],
  })
}
