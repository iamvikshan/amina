import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
} from 'discord.js'
import { Logger } from '@helpers/Logger'

const command: CommandData = {
  name: 'profile',
  description:
    'customize your bio, pronouns (allows me not to mispronoun you), and more',
  category: 'UTILITY',
  dmCommand: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    try {
      const { showProfileHub } = await import('@handlers/profile')
      await showProfileHub(interaction)
    } catch (error) {
      Logger.error('Error showing profile hub', error)
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            'there was an error opening the profile editor. try again later.',
          ephemeral: true,
        })
      }
    }
  },
}

export function createBasicModal(): ModalBuilder {
  const birthdateInput = new TextInputBuilder({
    customId: 'birthdate',
    label: "when's your special day?",
    style: TextInputStyle.Short,
    placeholder: 'DD/MM/YYYY or MM/YYYY',
    required: true,
    maxLength: 10,
  })

  const pronounsInput = new TextInputBuilder({
    customId: 'pronouns',
    label: 'how should we refer to you?',
    style: TextInputStyle.Short,
    placeholder: 'they/them, she/her, he/him, or anything else!',
    required: false,
    maxLength: 50,
  })

  const regionInput = new TextInputBuilder({
    customId: 'region',
    label: 'where do you call home?',
    style: TextInputStyle.Short,
    placeholder: 'your corner of the world',
    required: false,
    maxLength: 100,
  })

  const languagesInput = new TextInputBuilder({
    customId: 'languages',
    label: 'what languages do you speak?',
    style: TextInputStyle.Short,
    placeholder: 'english, español, 日本語...',
    required: false,
    maxLength: 100,
  })

  const timezoneInput = new TextInputBuilder({
    customId: 'timezone',
    label: "what's your timezone?",
    style: TextInputStyle.Short,
    placeholder: 'UTC+1, EST, GMT...',
    required: false,
    maxLength: 30,
  })

  return new ModalBuilder({
    customId: 'profile_set_basic_modal',
    title: "let's start with the basics!",
    components: [
      new ActionRowBuilder<TextInputBuilder>().addComponents(birthdateInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(pronounsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(regionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(languagesInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(timezoneInput),
    ],
  })
}

export function createMiscModal(): ModalBuilder {
  const bioInput = new TextInputBuilder({
    customId: 'bio',
    label: 'paint us a picture of who you are!',
    style: TextInputStyle.Paragraph,
    placeholder: 'your story, your way...',
    required: false,
    maxLength: 1000,
  })

  const interestsInput = new TextInputBuilder({
    customId: 'interests',
    label: 'what makes your heart skip a beat?',
    style: TextInputStyle.Short,
    placeholder: 'gaming, art, music...',
    required: false,
    maxLength: 200,
  })

  const socialsInput = new TextInputBuilder({
    customId: 'socials',
    label: 'where else can we find you?',
    style: TextInputStyle.Short,
    placeholder: 'twitter: @handle, instagram: @user...',
    required: false,
    maxLength: 200,
  })

  const favoritesInput = new TextInputBuilder({
    customId: 'favorites',
    label: 'what are your absolute favorites?',
    style: TextInputStyle.Short,
    placeholder: 'color: blue, food: pizza...',
    required: false,
    maxLength: 200,
  })

  const goalsInput = new TextInputBuilder({
    customId: 'goals',
    label: 'what dreams are you chasing?',
    style: TextInputStyle.Short,
    placeholder: 'learning guitar, visiting japan...',
    required: false,
    maxLength: 200,
  })

  return new ModalBuilder({
    customId: 'profile_set_misc_modal',
    title: 'tell us your story!',
    components: [
      new ActionRowBuilder<TextInputBuilder>().addComponents(bioInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(interestsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(socialsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(favoritesInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(goalsInput),
    ],
  })
}

// handleSet, handlePrivacy, and handleClear are now handled in the hub
// These functions are no longer needed as subcommands

// Helper Functions
export function formatValue(value: any): string {
  if (!value) return 'Not set'
  if (Array.isArray(value)) return value.join(', ') || 'None'
  if (value instanceof Map)
    return Array.from(value.values()).join(', ') || 'None'
  return String(value)
}

const SOCIAL_PLATFORMS: Record<
  string,
  (username: string, platform?: string) => string
> = {
  youtube: (username: string) => `https://youtube.com/@${username}`,
  twitter: (username: string) => `https://x.com/${username}`,
  x: (username: string) => `https://x.com/${username}`,
  github: (username: string) => `https://github.com/${username}`,
  instagram: (username: string) => `https://instagram.com/${username}`,
  twitch: (username: string) => `https://twitch.tv/${username}`,
  linkedin: (username: string) => `https://linkedin.com/in/${username}`,
  default: (username: string, platform: string = '') =>
    `https://${platform}.com/${username}`,
}

export function formatSocialLinks(
  socials: Map<string, string> | undefined
): string {
  if (!socials || socials.size === 0) return ''

  return (
    Array.from(socials.entries())
      .map(([platform, username]) => {
        const cleanPlatform = platform.toLowerCase().trim()
        const linkGenerator =
          SOCIAL_PLATFORMS[cleanPlatform] || SOCIAL_PLATFORMS.default
        const link = linkGenerator(username, cleanPlatform)
        return `${platform}: [${username}](${link})`
      })
      .join(' • ') || 'None'
  )
}

export function formatFavorites(
  favorites: Map<string, string> | undefined
): string {
  if (!favorites || favorites.size === 0) return ''

  return (
    Array.from(favorites.entries())
      .map(([category, item]) => `${category}: ${item}`)
      .join('\n') || 'None'
  )
}

export function hasContent(profile: any): boolean {
  if (!profile) return false

  const fields = [
    'pronouns',
    'age',
    'region',
    'timezone',
    'bio',
    'languages',
    'interests',
    'goals',
  ]

  return (
    fields.some(field => {
      const value = profile[field]
      return Array.isArray(value) ? value.length > 0 : Boolean(value)
    }) ||
    profile.socials?.size > 0 ||
    profile.favorites?.size > 0
  )
}

// handleClear is now handled in the hub via showClearConfirmation

export default command
