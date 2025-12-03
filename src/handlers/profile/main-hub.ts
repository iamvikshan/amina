import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { showEditMenu } from './edit'
import { showPrivacyMenu } from './privacy'
import { showClearConfirmation } from './clear'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show the main profile hub menu
 */
export async function showProfileHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('profile hub')
    .setDescription(
      'welcome to your profile management center. choose an option below.\n\n' +
        '**edit profile** - update your profile information\n' +
        '**privacy settings** - control what others can see\n' +
        '**clear profile** - start fresh with a blank canvas\n\n' +
        "tip: use `/profile view` to see your profile or `/profile view user:@someone` to see someone else's"
    )
    .setFooter({ text: 'select an option from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('profile:menu:operation')
      .setPlaceholder('choose a profile operation')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Edit Profile')
          .setDescription('Update your profile information')
          .setValue('edit'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Privacy Settings')
          .setDescription('Control what others can see')
          .setValue('privacy'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Clear Profile')
          .setDescription('Start fresh with a blank canvas')
          .setValue('clear'),
      ])
  )

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [menuRow],
    })
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [menuRow],
      ephemeral: true,
    })
  }
}

/**
 * Handle profile operation selection from main hub
 */
export async function handleProfileOperationMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  await interaction.deferUpdate()

  switch (operation) {
    case 'edit':
      await showEditMenu(interaction)
      break
    case 'privacy':
      await showPrivacyMenu(interaction)
      break
    case 'clear':
      await showClearConfirmation(interaction)
      break
    default:
      await interaction.followUp({
        content: 'invalid operation selected',
        ephemeral: true,
      })
  }
}

/**
 * Handle back button to return to main profile hub
 */
export async function handleProfileBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showProfileHub(interaction)
}
