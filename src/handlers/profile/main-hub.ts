import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { showEditMenu } from './edit'
import { showPrivacyMenu } from './privacy'
import { showClearConfirmation } from './clear'

/**
 * Show the main profile hub menu
 */
export async function showProfileHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('✨ Profile Hub')
    .setDescription(
      'Welcome to your profile management center! Choose an option below.\n\n' +
        '**Edit Profile** - Update your profile information\n' +
        '**Privacy Settings** - Control what others can see\n' +
        '**Clear Profile** - Start fresh with a blank canvas\n\n' +
        "💡 **Tip:** Use `/profile view` to see your profile or `/profile view user:@someone` to see someone else's!"
    )
    .setFooter({ text: 'Select an option from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('profile:menu:operation')
      .setPlaceholder('Choose a profile operation')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Edit Profile')
          .setDescription('Update your profile information')
          .setValue('edit')
          .setEmoji('✏️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Privacy Settings')
          .setDescription('Control what others can see')
          .setValue('privacy')
          .setEmoji('🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Clear Profile')
          .setDescription('Start fresh with a blank canvas')
          .setValue('clear')
          .setEmoji('🗑️'),
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
        content: '❌ Invalid operation selected',
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
