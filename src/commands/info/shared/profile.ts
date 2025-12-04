import { User, ChatInputCommandInteraction } from 'discord.js'
import { getUser } from '@schemas/User'
import { Logger } from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import {
  formatValue,
  formatSocialLinks,
  formatFavorites,
  hasContent,
} from '@commands/utility/profile'

/**
 * Handle viewing a user's profile
 * Used by /info profile command
 */
export default async function profileView(
  interaction: ChatInputCommandInteraction,
  target: User
): Promise<void> {
  try {
    const userDb = await getUser(target)
    const isOwnProfile = target.id === interaction.user.id
    const { profile } = userDb

    // Check if profile exists and has content
    if (!hasContent(profile)) {
      const embed = MinaEmbed.error()
        .setDescription(
          `${isOwnProfile ? "you haven't" : "this user hasn't"} set up a profile yet!`
        )
        .setFooter({ text: 'use /profile to create your profile!' })

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
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(replyOptions)
    } else {
      replyOptions.ephemeral = isOwnProfile
      await interaction.reply(replyOptions)
    }
  } catch (error) {
    Logger.error('Error in profileView', error)
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          'there was an error while viewing the profile. please try again later.',
        ephemeral: true,
      })
    }
  }
}
