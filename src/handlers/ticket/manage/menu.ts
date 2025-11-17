import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show manage menu with runtime operations
 */
export async function showManageMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '📋 Ticket Management' })
    .setDescription(
      'Runtime ticket operations:\n\n' +
        '🔒 **Close Ticket** - Close the current ticket channel\n' +
        '🗑️ **Close All** - Close all open tickets (bulk operation)\n' +
        '➕ **Add User** - Add users to current ticket\n' +
        '➖ **Remove User** - Remove users from current ticket\n\n' +
        'Select an operation below:'
    )
    .setFooter({ text: 'Use the back button to return to main hub' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:manage')
      .setPlaceholder('⚙️ Select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Close Ticket')
          .setDescription('Close the current ticket channel')
          .setValue('close')
          .setEmoji('🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Close All')
          .setDescription('Close all open tickets (bulk)')
          .setValue('closeall')
          .setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Add User')
          .setDescription('Add users to current ticket')
          .setValue('add')
          .setEmoji('➕'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Remove User')
          .setDescription('Remove users from current ticket')
          .setValue('remove')
          .setEmoji('➖')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back',
    label: 'Back to Ticket Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle manage menu selection
 */
export async function handleManageMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const option = interaction.values[0]
  const channel = interaction.channel

  // Check if admin is in a ticket channel for operations that require it
  if (option !== 'closeall') {
    const { isTicketChannel } = await import('@handlers/ticket/shared/utils')
    if (!channel || !isTicketChannel(channel)) {
      await interaction.deferUpdate()

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(
          '❌ You need to be in a ticket channel to use this operation!\n\n' +
            'Please navigate to the ticket channel you want to manage and run the command from there.'
        )

      // Try to find any ticket channel to provide as example
      const ticketChannels = interaction.guild!.channels.cache.filter(ch =>
        isTicketChannel(ch)
      )

      if (ticketChannels.size > 0) {
        const exampleChannel = ticketChannels.first()!
        const linkButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('View Example Ticket')
            .setURL(
              `https://discord.com/channels/${interaction.guild!.id}/${exampleChannel.id}`
            )
            .setStyle(ButtonStyle.Link)
        )

        const backButton = createSecondaryBtn({
          customId: 'ticket:btn:back_manage',
          label: 'Back to Manage',
          emoji: '◀️',
        })

        await interaction.editReply({
          embeds: [embed],
          components: [linkButton, backButton],
        })
      } else {
        const backButton = createSecondaryBtn({
          customId: 'ticket:btn:back_manage',
          label: 'Back to Manage',
          emoji: '◀️',
        })

        await interaction.editReply({
          embeds: [embed],
          components: [backButton],
        })
      }
      return
    }
  }

  switch (option) {
    case 'close':
      const { handleCloseTicket } = await import('./close')
      await interaction.deferUpdate()
      await handleCloseTicket(interaction)
      break
    case 'closeall':
      const { showCloseAllConfirmation } = await import('./close-all')
      await interaction.deferUpdate()
      await showCloseAllConfirmation(interaction)
      break
    case 'add':
      const { showAddUserSelect } = await import('./add-user')
      await showAddUserSelect(interaction)
      break
    case 'remove':
      const { showRemoveUserSelect } = await import('./remove-user')
      await showRemoveUserSelect(interaction)
      break
    default:
      await interaction.reply({
        content: '❌ Invalid manage option',
        flags: MessageFlags.Ephemeral,
      })
  }
}
