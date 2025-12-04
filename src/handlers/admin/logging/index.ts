import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { MinaRows } from '@helpers/componentHelper'
import { handleAdminBackButton } from '../main-hub'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show Logging Configuration menu
 */
export async function showLoggingMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild)
  const logsChannel = settings.logs_channel
    ? `<#${settings.logs_channel}>`
    : 'not set'
  const logsEnabled = settings.logs?.enabled ? 'enabled' : 'disabled'

  const embed = MinaEmbed.primary()
    .setTitle('logging configuration')
    .setDescription(
      'configure moderation and event logging.\n\n' +
        `**log channel:** ${logsChannel}\n` +
        `**status:** ${logsEnabled}\n\n` +
        `**member logs:**\n` +
        `- message edit: ${settings.logs?.member?.message_edit ? 'yes' : 'no'}\n` +
        `- message delete: ${settings.logs?.member?.message_delete ? 'yes' : 'no'}\n` +
        `- role changes: ${settings.logs?.member?.role_changes ? 'yes' : 'no'}\n\n` +
        `**channel logs:**\n` +
        `- create: ${settings.logs?.channel?.create ? 'yes' : 'no'}\n` +
        `- edit: ${settings.logs?.channel?.edit ? 'yes' : 'no'}\n` +
        `- delete: ${settings.logs?.channel?.delete ? 'yes' : 'no'}\n\n` +
        `**role logs:**\n` +
        `- create: ${settings.logs?.role?.create ? 'yes' : 'no'}\n` +
        `- edit: ${settings.logs?.role?.edit ? 'yes' : 'no'}\n` +
        `- delete: ${settings.logs?.role?.delete ? 'yes' : 'no'}`
    )
    .setFooter({ text: 'select an action from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:logs')
      .setPlaceholder('choose a logging setting')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('set log channel')
          .setDescription('choose where logs are sent')
          .setValue('setchannel'),
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle all logs')
          .setDescription('enable or disable all logging')
          .setValue('toggleall'),
        new StringSelectMenuOptionBuilder()
          .setLabel('message edit logs')
          .setDescription('toggle message edit logging')
          .setValue('toggle:logs.member.message_edit'),
        new StringSelectMenuOptionBuilder()
          .setLabel('message delete logs')
          .setDescription('toggle message delete logging')
          .setValue('toggle:logs.member.message_delete'),
        new StringSelectMenuOptionBuilder()
          .setLabel('role change logs')
          .setDescription('toggle role change logging')
          .setValue('toggle:logs.member.role_changes'),
        new StringSelectMenuOptionBuilder()
          .setLabel('channel logs')
          .setDescription('toggle all channel event logging')
          .setValue('toggle:logs.channel'),
        new StringSelectMenuOptionBuilder()
          .setLabel('role logs')
          .setDescription('toggle all role event logging')
          .setValue('toggle:logs.role'),
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
      const embed = MinaEmbed.primary().setDescription(
        'select a channel for moderation logs... all logging events will be sent there. make sure i have send messages and embed links permissions!'
      )

      const channelSelect =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('admin:channel:logchannel')
            .setPlaceholder('select a text channel')
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

      const embed = newState
        ? MinaEmbed.success('all logging has been enabled!')
        : MinaEmbed.warning('all logging has been disabled')
      await interaction.editReply({
        embeds: [embed],
        components: [MinaRows.backRow('admin:btn:back')],
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
        const embed = newValue
          ? MinaEmbed.success(`${settingName} logging has been enabled!`)
          : MinaEmbed.warning(`${settingName} logging has been disabled`)
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRows.backRow('admin:btn:back')],
        })
      }
      break
    }
  }
}
