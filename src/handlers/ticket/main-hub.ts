import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

/**
 * Show main ticket hub with operation selection
 */
export async function showTicketHub(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('ticket.hub.title') })
    .setDescription(mina.say('ticket.hub.description'))
    .setFooter({ text: mina.say('ticket.hub.footer') })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:category')
      .setPlaceholder(mina.say('ticket.hub.selectPlaceholder'))
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(mina.say('ticket.hub.setup.label'))
          .setDescription(mina.say('ticket.hub.setup.description'))
          .setValue('setup'),
        new StringSelectMenuOptionBuilder()
          .setLabel(mina.say('ticket.hub.manage.label'))
          .setDescription(mina.say('ticket.hub.manage.description'))
          .setValue('manage')
      )
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menu],
  })
}

/**
 * Handle ticket category selection from main hub
 */
export async function handleTicketCategoryMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const category = interaction.values[0]

  await interaction.deferUpdate()

  switch (category) {
    case 'setup': {
      const { showSetupMenu } = await import('./setup/menu')
      await showSetupMenu(interaction)
      break
    }
    case 'manage': {
      const { showManageMenu } = await import('./manage/menu')
      await showManageMenu(interaction)
      break
    }
    default: {
      await interaction.followUp({
        content: mina.say('error.invalidCategory'),
        flags: MessageFlags.Ephemeral,
      })
    }
  }
}

/**
 * Handle back button to return to main ticket hub
 */
export async function handleTicketBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showTicketHub(interaction)
}
