import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'

/**
 * Show setup menu with configuration options
 */
export async function showSetupMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'ticket setup' })
    .setDescription(
      'configure your ticket system settings:\n\n' +
        '**setup message** - create ticket creation message in a channel\n' +
        '**log channel** - set channel for ticket logs\n' +
        '**ticket limit** - set max concurrent open tickets per user\n' +
        '**manage topics** - add/remove/list ticket topics\n\n' +
        'select an option below to continue:'
    )
    .setFooter({ text: 'use the back button to return to main hub' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:setup')
      .setPlaceholder('select a setup option...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('setup message')
          .setDescription('create ticket creation message')
          .setValue('message'),
        new StringSelectMenuOptionBuilder()
          .setLabel('log channel')
          .setDescription('configure log channel for tickets')
          .setValue('log'),
        new StringSelectMenuOptionBuilder()
          .setLabel('ticket limit')
          .setDescription('set max open tickets per user')
          .setValue('limit'),
        new StringSelectMenuOptionBuilder()
          .setLabel('manage topics')
          .setDescription('add, remove, or list ticket topics')
          .setValue('topics')
      )
  )

  const backRow = MinaRows.backRow('ticket:btn:back')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
  })
}

/**
 * Handle setup menu selection
 */
export async function handleSetupMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const option = interaction.values[0]

  switch (option) {
    case 'message': {
      // Show channel select for ticket message
      const { showMessageChannelSelect } = await import('./message')
      await showMessageChannelSelect(interaction)
      break
    }
    case 'log': {
      // Show channel select for log channel
      const { showLogChannelSelect } = await import('./log-channel')
      await showLogChannelSelect(interaction)
      break
    }
    case 'limit': {
      // Show modal for limit input
      const { showLimitModal } = await import('./limit')
      await showLimitModal(interaction)
      break
    }
    case 'topics': {
      // Show topics submenu
      const { showTopicsMenu } = await import('./topics')
      await interaction.deferUpdate()
      await showTopicsMenu(interaction)
      break
    }
    default:
      await interaction.reply({
        content: 'invalid setup option',
        flags: MessageFlags.Ephemeral,
      })
  }
}
