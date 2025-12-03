import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { getUser } from '@schemas/User'
import { Logger } from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'profile',
  description: 'express yourself and share your story with the world!',
  category: 'UTILITY',
  dmCommand: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'hub',
        description: 'open the profile management hub',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'view',
        description: "view a profile (yours or someone else's)",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description:
              'whose profile do you want to view? (leave empty for your own)',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()

    switch (sub) {
      case 'hub':
        const { showProfileHub } = await import('@handlers/profile')
        // Don't reply here - let showProfileHub handle it
        await showProfileHub(interaction)
        return
      case 'view':
        // Only for viewing OTHER users' profiles
        return handleView(interaction)
      default:
        // Fallback: show hub for any other subcommand (backward compatibility)
        const { showProfileHub: showHub } = await import('@handlers/profile')
        await showHub(interaction)
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
function formatValue(value: any): string {
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

async function handleView(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  try {
    const target = interaction.options.getUser('user') || interaction.user
    const userDb = await getUser(target)
    const isOwnProfile = target.id === interaction.user.id
    const { profile } = userDb

    // Check if profile exists and has content
    if (!hasContent(profile)) {
      const embed = MinaEmbed.error()
        .setDescription(
          `${isOwnProfile ? "you haven't" : "this user hasn't"} set up a profile yet!`
        )
        .setFooter({ text: 'use /profile hub to create your profile!' })

      // Check if already deferred/replied (command handler may have deferred)
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] })
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true })
      }
      return
    }

    const embed = MinaEmbed.primary()
      .setAuthor({
        name: `${target.username}'s profile`,
        iconURL: target.displayAvatarURL(),
      })
      .setThumbnail(target.displayAvatarURL())

    // Track visible content for privacy checks
    let hasVisibleContent = false

    // Basic Information Fields
    const basicFields: Array<{
      name: keyof typeof profile
      label: string
      privacyKey?: keyof NonNullable<typeof profile.privacy>
      inline: boolean
    }> = [
      {
        name: 'pronouns',
        label: 'Pronouns',
        privacyKey: 'showPronouns',
        inline: true,
      },
      {
        name: 'age',
        label: 'Age',
        privacyKey: 'showAge',
        inline: true,
      },
      {
        name: 'region',
        label: 'Region',
        privacyKey: 'showRegion',
        inline: true,
      },
      {
        name: 'timezone',
        label: 'Timezone',
        inline: true,
      },
    ]

    // Add basic fields
    basicFields.forEach(field => {
      const value = profile[field.name]
      if (!value) return

      const isVisible =
        !field.privacyKey || isOwnProfile || profile.privacy?.[field.privacyKey]
      if (!isVisible) return

      hasVisibleContent = true
      embed.addFields({
        name: `${field.label}${isOwnProfile && field.privacyKey && !profile.privacy?.[field.privacyKey] ? ' 🔒' : ''}`,
        value: formatValue(value),
        inline: field.inline,
      })
    })

    // Languages (with null check and empty array handling)
    if (Array.isArray(profile.languages) && profile.languages.length > 0) {
      hasVisibleContent = true
      embed.addFields({
        name: 'Languages',
        value: formatValue(profile.languages),
        inline: true,
      })
    }

    // Add spacer if we have basic fields
    if (hasVisibleContent) {
      embed.addFields({ name: '\u200B', value: '\u200B', inline: false })
    }

    // Bio
    if (profile.bio) {
      hasVisibleContent = true
      embed.addFields({
        name: 'Bio',
        value: profile.bio,
        inline: false,
      })
    }

    // Interests
    if (Array.isArray(profile.interests) && profile.interests.length > 0) {
      hasVisibleContent = true
      embed.addFields({
        name: 'Interests',
        value: formatValue(profile.interests),
        inline: false,
      })
    }

    // Goals
    if (Array.isArray(profile.goals) && profile.goals.length > 0) {
      hasVisibleContent = true
      embed.addFields({
        name: 'Goals',
        value: formatValue(profile.goals),
        inline: false,
      })
    }

    // Social Links
    if (profile.socials?.size > 0) {
      const socialLinks = formatSocialLinks(profile.socials)
      if (socialLinks) {
        hasVisibleContent = true
        embed.addFields({
          name: 'Social Links',
          value: socialLinks,
          inline: false,
        })
      }
    }

    // Favorites
    if (profile.favorites?.size > 0) {
      const favoritesList = formatFavorites(profile.favorites)
      if (favoritesList) {
        hasVisibleContent = true
        embed.addFields({
          name: 'Favorites',
          value: favoritesList,
          inline: false,
        })
      }
    }

    // Check if there's any visible content for other users
    if (!isOwnProfile && !hasVisibleContent) {
      const privateEmbed = MinaEmbed.error().setDescription(
        `${target.username}'s profile is private.`
      )

      // Check if already deferred/replied (command handler may have deferred)
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [privateEmbed] })
      } else {
        await interaction.reply({ embeds: [privateEmbed], ephemeral: true })
      }
      return
    }

    // Add Last Updated timestamp
    if (profile.lastUpdated) {
      embed.setFooter({
        text: `Last Updated: ${profile.lastUpdated.toLocaleDateString()} ${profile.lastUpdated.toLocaleTimeString()} UTC`,
      })
    }

    // Generate privacy summary for own profile
    if (isOwnProfile) {
      const privateFields = basicFields
        .filter(
          ({ name, privacyKey }) =>
            privacyKey && !profile.privacy?.[privacyKey] && profile[name]
        )
        .map(({ label }) => label)

      if (privateFields.length > 0) {
        embed.setDescription(
          `**Note:** Fields marked with 🔒 are private and only visible to you.\nPrivate fields: ${privateFields.join(', ')}`
        )
      }
    }

    // Add edit button for own profile
    const replyOptions: any = {
      embeds: [embed],
    }

    if (isOwnProfile) {
      const { createEditButton } = await import('@handlers/profile/view')
      replyOptions.components = [createEditButton()]
    }

    // Send the profile embed
    // Check if already deferred/replied (command handler may have deferred)
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(replyOptions)
    } else {
      replyOptions.ephemeral = isOwnProfile // Ephemeral for own profile, visible for others
      await interaction.reply(replyOptions)
    }
  } catch (error) {
    Logger.error('Error in handleView', error)
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          'There was an error while viewing the profile. Please try again later.',
        ephemeral: true,
      })
    }
  }
}

// handleClear is now handled in the hub via showClearConfirmation

export default command
