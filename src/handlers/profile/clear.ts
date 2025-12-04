import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ButtonStyle,
} from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { clearProfile } from '@schemas/User'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { Logger } from '@helpers/Logger'

/**
 * Legacy handler for old String Select Menu clear confirmation
 * Kept for backward compatibility
 */
export async function handleProfileClear(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const selected = interaction.values[0]

  if (selected === 'cancel') {
    await interaction.update({
      content: 'keeping your profile just as it is!',
      embeds: [],
      components: [],
    })
    return
  }

  try {
    await clearProfile(interaction.user.id)

    const embed = MinaEmbed.success(
      'fresh start achieved! your canvas is clean and ready for a new masterpiece!'
    )

    await interaction.update({
      embeds: [embed],
      components: [],
    })
  } catch (error) {
    Logger.error('Error clearing profile', error)
    await interaction.update({
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
  const embed = MinaEmbed.warning()
    .setTitle('clear profile')
    .setDescription(
      '**are you sure you want to clear your entire profile?**\n\n' +
        'this will permanently delete all your profile information including:\n' +
        '- basic info (pronouns, birthdate, region, etc.)\n' +
        '- bio and interests\n' +
        '- social links and favorites\n' +
        '- goals\n\n' +
        '**this action cannot be undone!**'
    )

  const confirmRow = MinaRows.single(
    MinaButtons.custom(
      'profile:btn:clear_confirm',
      'yes, clear my profile',
      ButtonStyle.Danger
    )
  )

  const cancelRow = MinaRows.single(
    MinaButtons.custom(
      'profile:btn:clear_cancel',
      'no, keep my profile',
      ButtonStyle.Secondary
    )
  )

  const backRow = MinaRows.backRow('profile:btn:back')

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

    const embed = MinaEmbed.success(
      'fresh start achieved! your canvas is clean and ready for a new masterpiece!'
    )

    await interaction.deferUpdate()
    await interaction.editReply({
      embeds: [embed],
      components: [],
    })
  } catch (error) {
    Logger.error('Error clearing profile', error)
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
    content: 'keeping your profile just as it is!',
    embeds: [],
    components: [],
  })
}
