import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show Truth or Dare operations menu
 */
export async function showTodMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('truth or dare management')
    .setDescription(
      'manage truth or dare questions!\n\n' +
        '**select an operation:**\n' +
        '**add question** - add a new tod question\n' +
        '**remove question** - delete a question by id\n\n' +
        'note: question ids follow the format: T1, D2, NHIE3, etc.'
    )
    .setFooter({ text: 'select an operation to begin' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:tod')
      .setPlaceholder('select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('add question')
          .setDescription('add a new truth or dare question')
          .setValue('add'),
        new StringSelectMenuOptionBuilder()
          .setLabel('remove question')
          .setDescription('delete a question by id')
          .setValue('remove')
      )
  )

  const backRow = MinaRows.backRow('dev:btn:back_tod')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
  })
}

/**
 * Handle ToD operation selection
 */
export async function handleTodMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  switch (operation) {
    case 'add': {
      const { showAddTodModal } = await import('./add')
      await showAddTodModal(interaction)
      break
    }
    case 'remove': {
      const { showRemoveTodModal } = await import('./remove')
      await showRemoveTodModal(interaction)
      break
    }
    default:
      await interaction.deferUpdate()
      await interaction.followUp({
        content: 'invalid operation selected',
        ephemeral: true,
      })
  }
}
