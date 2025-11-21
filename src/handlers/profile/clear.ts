import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createDangerBtn, createSecondaryBtn } from '@helpers/componentHelper'
import { handleProfileBackButton } from './main-hub'
import { clearProfile } from '@schemas/User'

/**
 * Legacy handler for old String Select Menu clear confirmation
 * Kept for backward compatibility
 */
export async function handleProfileClear(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const selected = interaction.values[0]

  if (selected === 'cancel') {
    return interaction.update({
      content: 'keeping your profile just as it is!',
      embeds: [],
      components: [],
    })
  }

  try {
    await clearProfile(interaction.user.id)

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        'fresh start achieved! your canvas is clean and ready for a new masterpiece!'
      )

    return interaction.update({
      embeds: [embed],
      components: [],
    })
  } catch (error) {
    console.error('Error clearing profile:', error)
    return interaction.update({
      content:
        'oh no! something went wrong while clearing your profile. want to try again?',
      components: [],
    })
  }
}

/**
 * Show clear profile confirmation
 */
export async function showClearConfirmation(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🗑️ Clear Profile')
    .setDescription(
      '⚠️ **Are you sure you want to clear your entire profile?**\n\n' +
        'This will permanently delete all your profile information including:\n' +
        '• Basic info (pronouns, birthdate, region, etc.)\n' +
        '• Bio and interests\n' +
        '• Social links and favorites\n' +
        '• Goals\n\n' +
        '**This action cannot be undone!**'
    )

  const confirmRow = createDangerBtn({
    customId: 'profile:btn:clear_confirm',
    label: 'Yes, Clear My Profile',
    emoji: '⚠️',
  })

  const cancelRow = createSecondaryBtn({
    customId: 'profile:btn:clear_cancel',
    label: 'No, Keep My Profile',
    emoji: '❌',
  })

  const backRow = createSecondaryBtn({
    customId: 'profile:btn:back',
    label: 'Back to Profile Hub',
    emoji: '◀️',
  })

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [confirmRow, cancelRow, backRow],
    })
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [confirmRow, cancelRow, backRow],
      ephemeral: true,
    })
  }
}

/**
 * Handle clear profile confirmation
 */
export async function handleClearConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    await clearProfile(interaction.user.id)

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        '✨ Fresh start achieved! Your canvas is clean and ready for a new masterpiece!'
      )

    await interaction.deferUpdate()
    await interaction.editReply({
      embeds: [embed],
      components: [],
    })
  } catch (error) {
    console.error('Error clearing profile:', error)
    await interaction.reply({
      content:
        'oh no! something went wrong while clearing your profile. want to try again?',
      ephemeral: true,
    })
  }
}

/**
 * Handle clear profile cancellation
 */
export async function handleClearCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await interaction.editReply({
    content: 'keeping your profile just as it is! ✨',
    embeds: [],
    components: [],
  })
}
