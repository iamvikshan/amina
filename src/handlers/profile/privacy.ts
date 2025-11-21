import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getUser } from '@schemas/User'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { handleProfileBackButton } from './main-hub'
import { Logger } from '@helpers/Logger'

/**
 * Show privacy settings menu
 */
export async function showPrivacyMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const user = await getUser(interaction.user)
  const privacy = user.profile?.privacy || {}

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🔒 Privacy Settings')
    .setDescription(
      'Control what parts of your profile are visible to others.\n\n' +
        '**Current Settings:**\n' +
        `• Age: ${privacy.showAge ? '✅ Visible' : '🔒 Hidden'}\n` +
        `• Region: ${privacy.showRegion ? '✅ Visible' : '🔒 Hidden'}\n` +
        `• Birthdate: ${privacy.showBirthdate ? '✅ Visible' : '🔒 Hidden'}\n` +
        `• Pronouns: ${privacy.showPronouns ? '✅ Visible' : '🔒 Hidden'}\n\n` +
        'Select a field below to toggle its visibility.'
    )

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('profile:menu:privacy')
      .setPlaceholder('Choose a field to toggle')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Age')
          .setDescription(
            `Currently ${privacy.showAge ? 'visible' : 'hidden'} - Click to toggle`
          )
          .setValue('showAge')
          .setEmoji(privacy.showAge ? '✅' : '🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Region')
          .setDescription(
            `Currently ${privacy.showRegion ? 'visible' : 'hidden'} - Click to toggle`
          )
          .setValue('showRegion')
          .setEmoji(privacy.showRegion ? '✅' : '🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Birthdate')
          .setDescription(
            `Currently ${privacy.showBirthdate ? 'visible' : 'hidden'} - Click to toggle`
          )
          .setValue('showBirthdate')
          .setEmoji(privacy.showBirthdate ? '✅' : '🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Pronouns')
          .setDescription(
            `Currently ${privacy.showPronouns ? 'visible' : 'hidden'} - Click to toggle`
          )
          .setValue('showPronouns')
          .setEmoji(privacy.showPronouns ? '✅' : '🔒'),
      ])
  )

  const backRow = createSecondaryBtn({
    customId: 'profile:btn:back',
    label: 'Back to Profile Hub',
    emoji: '◀️',
  })

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [menuRow, backRow],
    })
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [menuRow, backRow],
      ephemeral: true,
    })
  }
}

/**
 * Handle privacy setting toggle
 */
export async function handlePrivacyMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const setting = interaction.values[0]

  try {
    const user = await getUser(interaction.user)
    if (!user.profile) user.profile = {} as any
    if (!user.profile.privacy) user.profile.privacy = {} as any

    // Toggle the setting
    const currentValue = (user.profile.privacy as any)[setting] ?? true
    ;(user.profile.privacy as any)[setting] = !currentValue

    await user.save()

    const settingName = setting.replace('show', '').toLowerCase()
    const newValue = !currentValue

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        `✅ Updated your privacy settings! ${settingName} is now ${newValue ? 'visible' : 'hidden'} to others.`
      )

    await interaction.deferUpdate()
    await showPrivacyMenu(interaction)
  } catch (ex) {
    Logger.error('Error handling privacy settings', ex)
    await interaction.reply({
      content: 'An error occurred while updating privacy settings.',
      ephemeral: true,
    })
  }
}
