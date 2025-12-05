import {
  StringSelectMenuInteraction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { MinaButton, MinaRow } from '@structures/components'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

// ============================================
// STATUS INDICATORS
// ============================================
const STATUS = {
  on: '`on`',
  off: '`off`',
  notSet: '`not set`',
} as const

function status(enabled: boolean | undefined): string {
  return enabled ? STATUS.on : STATUS.off
}

// ============================================
// HUB CONTEXT DETECTION
// ============================================
function detectHubContext(components: any[]): boolean {
  for (const row of components) {
    if ('components' in row) {
      for (const component of row.components) {
        if ('customId' in component && component.customId?.includes('|hub')) {
          return true
        }
      }
    }
  }
  return false
}

// ============================================
// PAGE 1: Overview & General Settings
// ============================================
function buildPage1Embed(settings: any) {
  const logsChannel = settings.logs_channel
    ? `<#${settings.logs_channel}>`
    : STATUS.notSet
  const logsEnabled = settings.logs?.enabled

  return MinaEmbed.primary()
    .setTitle('logging configuration')
    .setDescription(
      `manage server event logging and moderation audit trails.\n\n` +
        `### general\n` +
        `**log channel** → ${logsChannel}\n` +
        `**master switch** → ${status(logsEnabled)}\n\n` +
        `### member events\n` +
        `**message edits** → ${status(settings.logs?.member?.message_edit)}\n` +
        `**message deletes** → ${status(settings.logs?.member?.message_delete)}\n` +
        `**role changes** → ${status(settings.logs?.member?.role_changes)}\n\n` +
        `### automod\n` +
        `**ghost ping detection** → ${status(settings.automod?.anti_ghostping)}`
    )
    .setFooter({ text: 'page 1/2 · general & member settings' })
}

function buildPage1Menu() {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:logs|page:1')
      .setPlaceholder('configure general & member logging')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('set log channel')
          .setDescription('choose where logs are sent')
          .setValue('setchannel'),
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle all logging')
          .setDescription('master switch for all logs')
          .setValue('toggleall'),
        new StringSelectMenuOptionBuilder()
          .setLabel('message edit logs')
          .setDescription('log when messages are edited')
          .setValue('toggle:logs.member.message_edit'),
        new StringSelectMenuOptionBuilder()
          .setLabel('message delete logs')
          .setDescription('log when messages are deleted')
          .setValue('toggle:logs.member.message_delete'),
        new StringSelectMenuOptionBuilder()
          .setLabel('member role changes')
          .setDescription('log when member roles change')
          .setValue('toggle:logs.member.role_changes'),
        new StringSelectMenuOptionBuilder()
          .setLabel('ghost ping detection')
          .setDescription('log deleted messages with mentions')
          .setValue('toggle:automod.anti_ghostping'),
      ])
  )
}

// ============================================
// PAGE 2: Channel & Role Events
// ============================================
function buildPage2Embed(settings: any) {
  return MinaEmbed.primary()
    .setTitle('logging configuration')
    .setDescription(
      `manage channel and role event logging.\n\n` +
        `### channel events\n` +
        `**channel created** → ${status(settings.logs?.channel?.create)}\n` +
        `**channel updated** → ${status(settings.logs?.channel?.edit)}\n` +
        `**channel deleted** → ${status(settings.logs?.channel?.delete)}\n\n` +
        `### role events\n` +
        `**role created** → ${status(settings.logs?.role?.create)}\n` +
        `**role updated** → ${status(settings.logs?.role?.edit)}\n` +
        `**role deleted** → ${status(settings.logs?.role?.delete)}\n\n` +
        `> use "all channel/role logs" to toggle entire categories`
    )
    .setFooter({ text: 'page 2/2 · channel & role settings' })
}

function buildPage2Menu() {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin:menu:logs|page:2')
      .setPlaceholder('configure channel & role logging')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('all channel logs')
          .setDescription('toggle all channel event logging')
          .setValue('toggle:logs.channel'),
        new StringSelectMenuOptionBuilder()
          .setLabel('channel created')
          .setDescription('log when channels are created')
          .setValue('toggle:logs.channel.create'),
        new StringSelectMenuOptionBuilder()
          .setLabel('channel updated')
          .setDescription('log when channels are modified')
          .setValue('toggle:logs.channel.edit'),
        new StringSelectMenuOptionBuilder()
          .setLabel('channel deleted')
          .setDescription('log when channels are deleted')
          .setValue('toggle:logs.channel.delete'),
        new StringSelectMenuOptionBuilder()
          .setLabel('all role logs')
          .setDescription('toggle all role event logging')
          .setValue('toggle:logs.role'),
        new StringSelectMenuOptionBuilder()
          .setLabel('role created')
          .setDescription('log when roles are created')
          .setValue('toggle:logs.role.create'),
        new StringSelectMenuOptionBuilder()
          .setLabel('role updated')
          .setDescription('log when roles are modified')
          .setValue('toggle:logs.role.edit'),
        new StringSelectMenuOptionBuilder()
          .setLabel('role deleted')
          .setDescription('log when roles are deleted')
          .setValue('toggle:logs.role.delete'),
      ])
  )
}

// ============================================
// BUTTON ROW BUILDERS
// ============================================
function buildButtonRow(page: number, showHub: boolean): MinaRow {
  const contextSuffix = showHub ? '|hub' : '|direct'

  if (showHub) {
    return MinaRow.of(
      MinaButton.prev(`admin:btn:logs_prev${contextSuffix}`, page === 1),
      MinaButton.hub(`admin:btn:back${contextSuffix}`),
      MinaButton.next(`admin:btn:logs_next${contextSuffix}`, page === 2)
    )
  }
  return MinaRow.of(
    MinaButton.prev(`admin:btn:logs_prev${contextSuffix}`, page === 1),
    MinaButton.next(`admin:btn:logs_next${contextSuffix}`, page === 2)
  )
}

// ============================================
// PUBLIC: Show Logging Menu
// ============================================

/**
 * Show Logging Configuration menu (from admin hub menu interaction)
 */
export async function showLoggingMenu(
  interaction: StringSelectMenuInteraction,
  page: number = 1
): Promise<void> {
  const settings = await getSettings(interaction.guild)

  const embed =
    page === 1 ? buildPage1Embed(settings) : buildPage2Embed(settings)
  const menuRow = page === 1 ? buildPage1Menu() : buildPage2Menu()
  const buttonRow = buildButtonRow(page, true) // Show hub button

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow, buttonRow],
  })
}

/**
 * Show Logging Configuration menu directly (from /logs command)
 */
export async function showLoggingMenuDirect(
  interaction: ChatInputCommandInteraction,
  page: number = 1
): Promise<void> {
  const settings = await getSettings(interaction.guild)

  const embed =
    page === 1 ? buildPage1Embed(settings) : buildPage2Embed(settings)
  const menuRow = page === 1 ? buildPage1Menu() : buildPage2Menu()
  const buttonRow = buildButtonRow(page, false) // No hub button

  const payload = {
    embeds: [embed],
    components: [menuRow, buttonRow],
  }

  if (interaction.deferred) {
    await interaction.editReply(payload)
  } else if (interaction.replied) {
    await interaction.followUp(payload)
  } else {
    await interaction.reply(payload)
  }
}

/**
 * Handle page navigation buttons
 */
export async function handleLoggingPageButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const [, , rawAction] = interaction.customId.split(':')
  // Extract base action by removing any context suffix (e.g., "|hub")
  const baseAction = rawAction.split('|')[0]
  const settings = await getSettings(interaction.guild)

  const newPage = baseAction === 'logs_next' ? 2 : 1

  const embed =
    newPage === 1 ? buildPage1Embed(settings) : buildPage2Embed(settings)
  const menuRow = newPage === 1 ? buildPage1Menu() : buildPage2Menu()

  const hasHub = detectHubContext(interaction.message.components)
  const newButtonRow = buildButtonRow(newPage, hasHub)

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow, newButtonRow],
  })
}

/**
 * Handle Logging action selection
 */
export async function handleLoggingMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]

  await interaction.deferUpdate()
  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'setchannel': {
      const embed = MinaEmbed.primary()
        .setTitle('set log channel')
        .setDescription(
          `select a channel where i'll send all log events.\n\n` +
            `> make sure i have **send messages** and **embed links** permissions in the channel`
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

      const buttonRow = MinaRow.backRow('admin:btn:back_logs')

      await interaction.editReply({
        embeds: [embed],
        components: [channelSelect, buttonRow],
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
        ? MinaEmbed.success(
            `### logging enabled\n` +
              `all configured log events will now be recorded.`
          )
        : MinaEmbed.warning(
            `### logging disabled\n` +
              `no events will be logged until you re-enable this.`
          )

      await interaction.editReply({
        embeds: [embed],
        components: [MinaRow.backRow('admin:btn:back_logs')],
      })
      break
    }

    default: {
      if (action.startsWith('toggle:')) {
        const path = action.replace('toggle:', '')
        const parts = path.split('.')

        // Navigate to parent and toggle
        let parent: any = settings
        for (let i = 0; i < parts.length - 1; i++) {
          if (!parent[parts[i]]) parent[parts[i]] = {}
          parent = parent[parts[i]]
        }

        const lastPart = parts[parts.length - 1]
        const currentValue = parent[lastPart]

        // If toggling a category object (channel/role), toggle all sub-settings
        if (typeof currentValue === 'object' && currentValue !== null) {
          const allEnabled = Object.values(currentValue).every(v => v === true)
          const newValue = !allEnabled
          Object.keys(currentValue).forEach(key => {
            if (typeof currentValue[key] === 'boolean') {
              currentValue[key] = newValue
            }
          })

          await settings.save()

          const categoryName = lastPart === 'channel' ? 'channel' : 'role'
          const embed = newValue
            ? MinaEmbed.success(
                `### ${categoryName} logs enabled\n` +
                  `all ${categoryName} events will now be logged.`
              )
            : MinaEmbed.warning(
                `### ${categoryName} logs disabled\n` +
                  `${categoryName} events will no longer be logged.`
              )

          await interaction.editReply({
            embeds: [embed],
            components: [MinaRow.backRow('admin:btn:back_logs')],
          })
        } else {
          // Toggle single boolean setting
          const newValue = !currentValue
          parent[lastPart] = newValue
          await settings.save()

          const settingName = lastPart.replace(/_/g, ' ')
          const embed = newValue
            ? MinaEmbed.success(`**${settingName}** logging enabled`)
            : MinaEmbed.warning(`**${settingName}** logging disabled`)

          await interaction.editReply({
            embeds: [embed],
            components: [MinaRow.backRow('admin:btn:back_logs')],
          })
        }
      }
      break
    }
  }
}

/**
 * Handle back to logs button
 */
export async function handleBackToLogs(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const settings = await getSettings(interaction.guild)

  // Default to page 1 when returning
  const embed = buildPage1Embed(settings)
  const menuRow = buildPage1Menu()

  const isHubContext = detectHubContext(interaction.message.components)
  const buttonRow = buildButtonRow(1, isHubContext)

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow, buttonRow],
  })
}
