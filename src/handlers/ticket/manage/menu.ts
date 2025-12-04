import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

/**
 * Show manage menu with runtime operations
 */
export async function showManageMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setAuthor({ name: mina.say('ticket.manage.title') })
    .setDescription(mina.say('ticket.manage.description'))
    .setFooter({ text: mina.say('ticket.manage.footer') })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:manage')
      .setPlaceholder('select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('close ticket')
          .setDescription('close the current ticket channel')
          .setValue('close'),
        new StringSelectMenuOptionBuilder()
          .setLabel('close all')
          .setDescription('close all open tickets (bulk)')
          .setValue('closeall'),
        new StringSelectMenuOptionBuilder()
          .setLabel('add user')
          .setDescription('add users to current ticket')
          .setValue('add'),
        new StringSelectMenuOptionBuilder()
          .setLabel('remove user')
          .setDescription('remove users from current ticket')
          .setValue('remove')
      )
  )

  const backButton = MinaRows.backRow('ticket:btn:back')

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
  const guild = interaction.guild
  if (!guild) return

  // Check if admin is in a ticket channel for operations that require it
  if (option !== 'closeall') {
    const { isTicketChannel } = await import('@handlers/ticket/shared/utils')
    if (!channel || !isTicketChannel(channel)) {
      await interaction.deferUpdate()

      const embed = MinaEmbed.error(mina.say('ticket.manage.notInTicket'))

      // Try to find any ticket channel to provide as example
      const ticketChannels = guild.channels.cache.filter(ch =>
        isTicketChannel(ch)
      )

      if (ticketChannels.size > 0) {
        const exampleChannel = ticketChannels.first()
        if (!exampleChannel) return
        const linkButton = MinaRows.from(
          MinaButtons.link(
            `https://discord.com/channels/${guild.id}/${exampleChannel.id}`,
            mina.say('ticket.manage.button')
          )
        )

        const backButton = MinaRows.backRow('ticket:btn:back_manage')

        await interaction.editReply({
          embeds: [embed],
          components: [linkButton, backButton],
        })
      } else {
        const backButton = MinaRows.backRow('ticket:btn:back_manage')

        await interaction.editReply({
          embeds: [embed],
          components: [backButton],
        })
      }
      return
    }
  }

  switch (option) {
    case 'close': {
      const { handleCloseTicket } = await import('./close')
      await interaction.deferUpdate()
      await handleCloseTicket(interaction)
      break
    }
    case 'closeall': {
      const { showCloseAllConfirmation } = await import('./closeAll')
      await interaction.deferUpdate()
      await showCloseAllConfirmation(interaction)
      break
    }
    case 'add': {
      const { showAddUserSelect } = await import('./addUser')
      await showAddUserSelect(interaction)
      break
    }
    case 'remove': {
      const { showRemoveUserSelect } = await import('./removeUser')
      await showRemoveUserSelect(interaction)
      break
    }
    default:
      await interaction.reply({
        content: 'invalid manage option',
        flags: MessageFlags.Ephemeral,
      })
  }
}
