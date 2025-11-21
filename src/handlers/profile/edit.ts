import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { handleProfileBackButton } from './main-hub'
import { createBasicModal, createMiscModal } from '@commands/utility/profile'
import { updateProfile, getUser } from '@schemas/User'
import { validateBirthdate, calculateAge } from './shared/utils'

/**
 * Show edit profile menu
 */
export async function showEditMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('✏️ Edit Profile')
    .setDescription(
      'Choose what you want to edit:\n\n' +
        '**Basic Info** - Pronouns, birthdate, region, languages, timezone\n' +
        '**Misc Info** - Bio, interests, socials, favorites, goals'
    )

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('profile:menu:edit')
      .setPlaceholder('Choose what to edit')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Basic Info')
          .setDescription('Pronouns, birthdate, region, languages, timezone')
          .setValue('basic')
          .setEmoji('📝'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Misc Info')
          .setDescription('Bio, interests, socials, favorites, goals')
          .setValue('misc')
          .setEmoji('🎨'),
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
 * Handle edit category selection
 */
export async function handleEditMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const category = interaction.values[0]

  let modal: ModalBuilder
  if (category === 'basic') {
    modal = createBasicModal()
  } else {
    modal = createMiscModal()
  }

  try {
    await interaction.showModal(modal)
  } catch (error) {
    console.error('Error showing edit modal:', error)
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'oops! something went wrong. try again?',
        ephemeral: true,
      })
    }
  }
}

/**
 * Handle profile modal submission
 */
export async function handleProfileModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  try {
    const customId = interaction.customId
    let profileData: any = {}

    if (customId === 'profile_set_basic_modal') {
      const birthdate = interaction.fields.getTextInputValue('birthdate')
      const birthdateValidation = validateBirthdate(birthdate)

      if (!birthdateValidation.isValid) {
        return interaction.reply({
          content: birthdateValidation.error,
          ephemeral: true,
        })
      }

      if (!birthdateValidation.date) {
        return interaction.reply({
          content: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
          ephemeral: true,
        })
      }

      profileData = {
        birthdate: birthdateValidation.date,
        age: calculateAge(birthdateValidation.date),
        pronouns: interaction.fields.getTextInputValue('pronouns') || null,
        region: interaction.fields.getTextInputValue('region') || null,
        languages:
          interaction.fields
            .getTextInputValue('languages')
            ?.split(',')
            .map(lang => lang.trim()) || [],
        timezone: interaction.fields.getTextInputValue('timezone') || null,
      }
    } else if (customId === 'profile_set_misc_modal') {
      // Parse socials string into a Map with better validation
      const socialsStr = interaction.fields.getTextInputValue('socials') || ''
      const socialsMap = new Map<string, string>()
      if (socialsStr.trim()) {
        const entries = socialsStr
          .split(',')
          .map(e => e.trim())
          .filter(Boolean)
        for (const entry of entries) {
          const colonIndex = entry.indexOf(':')
          if (colonIndex > 0 && colonIndex < entry.length - 1) {
            const platform = entry.substring(0, colonIndex).trim()
            const handle = entry.substring(colonIndex + 1).trim()
            if (platform && handle) {
              socialsMap.set(platform, handle)
            }
          }
        }
      }

      // Parse favorites string into a Map with better validation
      const favoritesStr =
        interaction.fields.getTextInputValue('favorites') || ''
      const favoritesMap = new Map<string, string>()
      if (favoritesStr.trim()) {
        const entries = favoritesStr
          .split(',')
          .map(e => e.trim())
          .filter(Boolean)
        for (const entry of entries) {
          const colonIndex = entry.indexOf(':')
          if (colonIndex > 0 && colonIndex < entry.length - 1) {
            const category = entry.substring(0, colonIndex).trim()
            const item = entry.substring(colonIndex + 1).trim()
            if (category && item) {
              favoritesMap.set(category, item)
            }
          }
        }
      }

      profileData = {
        bio: interaction.fields.getTextInputValue('bio') || null,
        interests:
          interaction.fields
            .getTextInputValue('interests')
            ?.split(',')
            .map(i => i.trim())
            .filter(Boolean) || [],
        socials: socialsMap,
        favorites: favoritesMap,
        goals:
          interaction.fields
            .getTextInputValue('goals')
            ?.split(',')
            .map(g => g.trim())
            .filter(Boolean) || [],
      }
    }

    // Preserve existing profile data
    const user = await getUser(interaction.user)
    const existingProfile = (user as any)?.profile || {}
    const existingPrivacy = existingProfile.privacy || {}

    // Preserve existing privacy settings instead of overwriting
    const updatedProfile = {
      ...existingProfile,
      ...profileData,
      privacy: {
        showAge: existingPrivacy.showAge ?? true,
        showRegion: existingPrivacy.showRegion ?? true,
        showBirthdate: existingPrivacy.showBirthdate ?? false,
        showPronouns: existingPrivacy.showPronouns ?? true,
        ...existingPrivacy, // Preserve any other privacy settings
      },
    }

    // Update user profile in database
    await updateProfile(interaction.user.id, updatedProfile)

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle('profile updated! ✨')
      .setDescription('your story has been beautifully updated!')
      .addFields({
        name: 'want to see?',
        value: 'use `/profile view` to see your masterpiece!',
      })

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    })
  } catch (error) {
    console.error('Error handling profile modal:', error)
    return interaction.reply({
      content:
        'oops! something went wrong while updating your profile. want to try again?',
      ephemeral: true,
    })
  }
}
