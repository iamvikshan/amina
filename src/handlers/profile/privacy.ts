import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { getUser } from '@schemas/User'
import { MinaRows } from '@helpers/componentHelper'
import { Logger } from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show privacy settings menu
 */
export async function showPrivacyMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const user = await getUser(interaction.user)
  const privacy = user.profile?.privacy || {}

  const embed = MinaEmbed.primary()
    .setTitle('privacy settings')
    .setDescription(
      'control what parts of your profile are visible to others.\n\n' +
        '**current settings:**\n' +
        `- age: ${privacy.showAge ? 'visible' : 'hidden'}\n` +
        `- region: ${privacy.showRegion ? 'visible' : 'hidden'}\n` +
        `- birthdate: ${privacy.showBirthdate ? 'visible' : 'hidden'}\n` +
        `- pronouns: ${privacy.showPronouns ? 'visible' : 'hidden'}\n\n` +
        'select a field below to toggle its visibility.'
    )

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('profile:menu:privacy')
      .setPlaceholder('choose a field to toggle')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('age')
          .setDescription(
            `currently ${privacy.showAge ? 'visible' : 'hidden'} - click to toggle`
          )
          .setValue('showAge'),
        new StringSelectMenuOptionBuilder()
          .setLabel('region')
          .setDescription(
            `currently ${privacy.showRegion ? 'visible' : 'hidden'} - click to toggle`
          )
          .setValue('showRegion'),
        new StringSelectMenuOptionBuilder()
          .setLabel('birthdate')
          .setDescription(
            `currently ${privacy.showBirthdate ? 'visible' : 'hidden'} - click to toggle`
          )
          .setValue('showBirthdate'),
        new StringSelectMenuOptionBuilder()
          .setLabel('pronouns')
          .setDescription(
            `currently ${privacy.showPronouns ? 'visible' : 'hidden'} - click to toggle`
          )
          .setValue('showPronouns'),
      ])
  )

  const backRow = MinaRows.backRow('profile:btn:back')

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
