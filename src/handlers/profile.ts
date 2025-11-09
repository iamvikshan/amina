import {
  EmbedBuilder,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { updateProfile, clearProfile, getUser } from '@schemas/User'

interface BirthdateValidation {
  isValid: boolean
  date?: Date
  error?: string
}

/**
 * Validates and parses a birthdate string
 */
function validateBirthdate(birthdate: string): BirthdateValidation {
  const ddmmyyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const mmyyyyRegex = /^(\d{2})\/(\d{4})$/

  let day: number, month: number, year: number

  if (ddmmyyyyRegex.test(birthdate)) {
    const match = birthdate.match(ddmmyyyyRegex)
    if (!match)
      return {
        isValid: false,
        error: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
      }
    const [, d, m, y] = match
    day = parseInt(d)
    month = parseInt(m) - 1 // JS months are 0-based
    year = parseInt(y)
  } else if (mmyyyyRegex.test(birthdate)) {
    const match = birthdate.match(mmyyyyRegex)
    if (!match)
      return {
        isValid: false,
        error: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
      }
    const [, m, y] = match
    day = 1
    month = parseInt(m) - 1
    year = parseInt(y)
  } else {
    return {
      isValid: false,
      error: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
    }
  }

  const date = new Date(year, month, day)

  // Validate date components
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    (day && date.getDate() !== day)
  ) {
    return { isValid: false, error: "that date doesn't exist!" }
  }

  // Check if date is in the future
  if (date > new Date()) {
    return {
      isValid: false,
      error: "time traveler detected! date can't be in the future",
    }
  }

  // Check if user is too young/old (e.g., under 13 or over 100)
  const age = calculateAge(date)
  if (age < 13) {
    return { isValid: false, error: 'sorry! you must be at least 13 years old' }
  }
  if (age > 100) {
    return {
      isValid: false,
      error: 'hmm, that seems a bit too far back. check the year?',
    }
  }

  return { isValid: true, date }
}

/**
 * Calculates age from birthdate
 */
function calculateAge(birthdate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--
  }

  return age
}

/**
 * Handle profile modal submission
 */
async function handleProfileModal(
  interaction: ModalSubmitInteraction
): Promise<any> {
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
      // Parse socials string into a Map
      const socialsStr = interaction.fields.getTextInputValue('socials') || ''
      const socialsMap = new Map<string, string>()
      socialsStr.split(',').forEach(entry => {
        const [platform, handle] = entry.split(':').map(s => s.trim())
        if (platform && handle) {
          socialsMap.set(platform, handle)
        }
      })

      // Parse favorites string into a Map
      const favoritesStr =
        interaction.fields.getTextInputValue('favorites') || ''
      const favoritesMap = new Map<string, string>()
      favoritesStr.split(',').forEach(entry => {
        const [category, item] = entry.split(':').map(s => s.trim())
        if (category && item) {
          favoritesMap.set(category, item)
        }
      })

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
    const updatedProfile = {
      ...existingProfile,
      ...profileData,
      privacy: {
        ...existingProfile.privacy,
        showAge: true,
        showRegion: true,
        showBirthdate: false,
        showPronouns: true,
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

/**
 * Handle profile clear confirmation
 */
async function handleProfileClear(
  interaction: StringSelectMenuInteraction
): Promise<any> {
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

export default { handleProfileModal, handleProfileClear }

