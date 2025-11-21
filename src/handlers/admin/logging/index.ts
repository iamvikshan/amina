import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings } from '@schemas/Guild'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { handleAdminBackButton } from '../main-hub'

/**
 * Show Logging Configuration menu
 */
export async function showLoggingMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild)
  const logsChannel = settings.logs_channel
    ? `<#${settings.logs_channel}>`
    : '❌ Not set'
  const logsEnabled = settings.logs?.enabled ? '✅ Enabled' : '❌ Disabled'

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('📋 Logging Configuration')
    .setDescription(
      'Configure moderation and event logging.\n\n' +
        `**Log Channel:** ${logsChannel}\n` +
        `**Status:** ${logsEnabled}\n\n` +
        `**Member Logs:**\n` +
        `• Message Edit: ${settings.logs?.member?.message_edit ? '✅' : '❌'}\n` +
        `• Message Delete: ${settings.logs?.member?.message_delete ? '✅' : '❌'}\n` +
        `• Role Changes: ${settings.logs?.member?.role_changes ? '✅' : '❌'}\n\n` +
        `**Channel Logs:**\n` +
        `• Create: ${settings.logs?.channel?.create ? '✅' : '❌'}\n` +
        `• Edit: ${settings.logs?.channel?.edit ? '✅' : '❌'}\n` +
        `• Delete: ${settings.logs?.channel?.delete ? '✅' : '❌'}\n\n` +
        `**Role Logs:**\n` +
        `• Create: ${settings.logs?.role?.create ? '✅' : '❌'}\n` +
        `• Edit: ${settings.logs?.role?.edit ? '✅' : '❌'}\n` +
        `• Delete: ${settings.logs?.role?.delete ? '✅' : '❌'}`
    )
    .setFooter({ text: 'Select an action from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:logs')
      .setPlaceholder('Choose a logging setting')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Log Channel')
          .setDescription('Choose where logs are sent')
          .setValue('setchannel')
          .setEmoji('📢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle All Logs')
          .setDescription('Enable or disable all logging')
          .setValue('toggleall')
          .setEmoji('🔄'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Message Edit Logs')
          .setDescription('Toggle message edit logging')
          .setValue('toggle:logs.member.message_edit')
          .setEmoji('✏️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Message Delete Logs')
          .setDescription('Toggle message delete logging')
          .setValue('toggle:logs.member.message_delete')
          .setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Role Change Logs')
          .setDescription('Toggle role change logging')
          .setValue('toggle:logs.member.role_changes')
          .setEmoji('👥'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Channel Logs')
          .setDescription('Toggle all channel event logging')
          .setValue('toggle:logs.channel')
          .setEmoji('📁'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Role Logs')
          .setDescription('Toggle all role event logging')
          .setValue('toggle:logs.role')
          .setEmoji('🏷️'),
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
 * Handle Logging action selection
 */
export async function handleLoggingMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]

  if (action === 'back') {
    await interaction.deferUpdate()
    await handleAdminBackButton(interaction as any)
    return
  }

  await interaction.deferUpdate()
  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'setchannel': {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setDescription(
          '📢 **Select a channel for moderation logs**\n\nAll logging events will be sent here. Make sure I have Send Messages and Embed Links permissions!'
        )

      const channelSelect =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('admin:channel:logchannel')
            .setPlaceholder('Select a text channel')
            .setChannelTypes([
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ])
        )

      await interaction.editReply({
        embeds: [embed],
        components: [channelSelect],
      })
      break
    }
    case 'toggleall': {
      const newState = !settings.logs?.enabled
      if (!settings.logs) {
        settings.logs = {
          enabled: true,
          member: {
            message_edit: false,
            message_delete: false,
            role_changes: false,
          },
          channel: {
            create: false,
            edit: false,
            delete: false,
          },
          role: {
            create: false,
            edit: false,
            delete: false,
          },
        }
      }
      settings.logs.enabled = newState
      await settings.save()

      const embed = new EmbedBuilder()
        .setColor(newState ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
        .setDescription(
          `📋 All logging has been **${newState ? 'enabled' : 'disabled'}**!`
        )
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back',
            label: 'Back to Admin Hub',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
    default: {
      if (action.startsWith('toggle:')) {
        const path = action.replace('toggle:', '')
        const parts = path.split('.')
        let currentValue = settings

        // Navigate to the setting
        for (const part of parts) {
          if (!(currentValue as any)[part]) (currentValue as any)[part] = {}
          currentValue = (currentValue as any)[part]
        }

        // Get current boolean value
        const lastPart = parts[parts.length - 1]
        const parentPath = parts.slice(0, -1)
        let parent: any = settings
        for (const part of parentPath) {
          if (!parent[part]) parent[part] = {}
          parent = parent[part]
        }

        const newValue = !parent[lastPart]
        parent[lastPart] = newValue

        // If toggling a subcategory (channel/role), toggle all sub-settings
        if (typeof parent[lastPart] === 'object' && parent[lastPart] !== null) {
          const category = parent[lastPart]
          Object.keys(category).forEach(key => {
            if (typeof category[key] === 'boolean') {
              category[key] = newValue
            }
          })
        }

        await settings.save()

        const settingName = lastPart.replace(/_/g, ' ')
        const embed = new EmbedBuilder()
          .setColor(newValue ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
          .setDescription(
            `${newValue ? '✅' : '❌'} **${settingName}** logging has been **${newValue ? 'enabled' : 'disabled'}**!`
          )
        await interaction.editReply({
          embeds: [embed],
          components: [
            createSecondaryBtn({
              customId: 'admin:btn:back',
              label: 'Back to Admin Hub',
              emoji: '◀️',
            }),
          ],
        })
      }
      break
    }
  }
}
