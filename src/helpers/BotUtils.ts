// src/helpers/BotUtils.ts
import HttpUtils from '@helpers/HttpUtils'
import { success, warn, error } from '@helpers/Logger'
import type { Message } from 'discord.js'
// Validation is now globally available - see types/commands.d.ts

/**
 * Bot utility class with helper methods for version checks, image extraction, etc.
 */
export default class BotUtils {
  /**
   * Check if the bot is up to date
   */
  static async checkForUpdates(): Promise<void> {
    const response = await HttpUtils.getJson(
      'https://api.github.com/repos/iamvikshan/amina/releases/latest'
    )

    if (!response.success) {
      return error('VersionCheck: Failed to check for bot updates')
    }

    if (response.data) {
      const packageJson = await import('@root/package.json')
      const currentVersion = packageJson.default.version
      const latestVersion = (response.data.tag_name as string).replace(/^v/, '')

      // Simple semver compare
      const v1 = currentVersion.split('.').map(Number)
      const v2 = latestVersion.split('.').map(Number)

      let isUpdateAvailable = false
      for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0
        const num2 = v2[i] || 0
        if (num1 < num2) {
          isUpdateAvailable = true
          break
        } else if (num1 > num2) {
          break
        }
      }

      if (!isUpdateAvailable) {
        success('VersionCheck: Your discord bot is up to date')
      } else {
        warn(`VersionCheck: ${response.data.tag_name} update is available`)
        warn('download: https://github.com/iamvikshan/amina/releases/latest')
      }
    }
  }

  /**
   * Get the image url from the message
   * @param message - The Discord message
   * @param args - Command arguments
   */
  static async getImageFromMessage(
    message: Message,
    args: string[]
  ): Promise<string> {
    let url: string | undefined

    // check for attachments
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first()
      const attachUrl = attachment?.url
      const attachIsImage =
        attachUrl?.endsWith('.png') ||
        attachUrl?.endsWith('.jpg') ||
        attachUrl?.endsWith('.jpeg')
      if (attachIsImage) url = attachUrl
    }

    if (!url && args.length === 0) {
      url = message.author.displayAvatarURL({ size: 256, extension: 'png' })
    }

    if (!url && args.length !== 0) {
      try {
        url = new URL(args[0]).href
      } catch (_ex) {
        /* Ignore */
      }
    }

    if (!url && message.mentions.users.size > 0) {
      url = message.mentions.users
        .first()
        ?.displayAvatarURL({ size: 256, extension: 'png' })
    }

    if (!url && message.guild) {
      const member = await message.guild.members
        .fetch(args[0])
        .catch(() => null)
      if (member) {
        url = member.user.displayAvatarURL({ size: 256, extension: 'png' })
      }
    }

    if (!url) {
      url = message.author.displayAvatarURL({ size: 256, extension: 'png' })
    }

    return url
  }

  /**
   * Music validation checks
   */
  static get musicValidations(): Validation[] {
    return [
      {
        callback: ({ client, guildId }: any) =>
          client.musicManager.getPlayer(guildId),
        message: "🚫 I'm not in a voice channel.",
      },
      {
        callback: ({ member }: any) => member.voice?.channelId,
        message: '🚫 You need to join my voice channel.',
      },
      {
        callback: ({ member, client, guildId }: any) =>
          member.voice?.channelId ===
          client.musicManager.getPlayer(guildId)?.voiceChannelId,
        message: "🚫 You're not in the same voice channel.",
      },
    ]
  }

  /**
   * Check if two commands are different
   * @param existing - The existing command from Discord
   * @param local - The local command definition
   * @param debug - If true, logs the reason for difference
   */
  static areCommandsDifferent(
    existing: any,
    local: any,
    debug = false
  ): boolean {
    // Helper to normalize strings by removing emoji variation selectors
    // Discord may strip variation selectors (U+FE0F, U+FE0E) from emoji
    const normalizeString = (str: string): string =>
      str?.replace(/[\uFE0E\uFE0F]/g, '') ?? ''

    // Check description
    if (existing.description !== local.description) {
      if (debug) console.log(`[${local.name}] description differs`)
      return true
    }

    // Check dm_permission (Discord.js returns dmPermission, API uses dm_permission)
    // Discord defaults to true if not specified for global commands
    // For guild commands, dmPermission is null and not applicable - skip comparison
    const existingDmPerm = existing.dmPermission
    const localDmPerm = local.dm_permission ?? local.dmPermission ?? null

    // Only compare if both are non-null (skip for guild commands where existing is null)
    if (existingDmPerm !== null && localDmPerm !== null) {
      const existingDmPermValue = existingDmPerm ?? true
      const localDmPermValue = localDmPerm ?? true
      if (existingDmPermValue !== localDmPermValue) {
        if (debug)
          console.log(
            `[${local.name}] dm_permission differs: ${existingDmPermValue} vs ${localDmPermValue}`
          )
        return true
      }
    }

    // Check options
    const existingOptions = existing.options || []
    const localOptions = local.options || []

    if (existingOptions.length !== localOptions.length) {
      if (debug)
        console.log(
          `[${local.name}] options length differs: ${existingOptions.length} vs ${localOptions.length}`
        )
      return true
    }

    // Helper to compare options recursively
    const compareOptions = (
      existingOpt: any,
      localOpt: any,
      path: string
    ): boolean => {
      if (existingOpt.name !== localOpt.name) {
        if (debug) console.log(`[${path}] name differs`)
        return true
      }
      if (existingOpt.description !== localOpt.description) {
        if (debug) console.log(`[${path}] description differs`)
        return true
      }
      if (existingOpt.type !== localOpt.type) {
        if (debug) console.log(`[${path}] type differs`)
        return true
      }
      // Discord defaults required to false
      if ((existingOpt.required ?? false) !== (localOpt.required ?? false)) {
        if (debug) console.log(`[${path}] required differs`)
        return true
      }

      // Check choices
      const existingChoices = existingOpt.choices || []
      const localChoices = localOpt.choices || []
      if (existingChoices.length !== localChoices.length) {
        if (debug) console.log(`[${path}] choices length differs`)
        return true
      }
      for (let i = 0; i < existingChoices.length; i++) {
        // Normalize choice names to handle emoji variation selector differences
        const existingName = normalizeString(existingChoices[i].name)
        const localName = normalizeString(localChoices[i].name)
        if (existingName !== localName) {
          if (debug)
            console.log(
              `[${path}] choice name differs at ${i}: "${existingChoices[i].name}" vs "${localChoices[i].name}"`
            )
          return true
        }
        if (existingChoices[i].value !== localChoices[i].value) {
          if (debug) console.log(`[${path}] choice value differs at ${i}`)
          return true
        }
      }

      // Check sub-options (for subcommands)
      const existingSubOptions = existingOpt.options || []
      const localSubOptions = localOpt.options || []
      if (existingSubOptions.length !== localSubOptions.length) {
        if (debug) console.log(`[${path}] sub-options length differs`)
        return true
      }

      for (let i = 0; i < existingSubOptions.length; i++) {
        const found = localSubOptions.find(
          (o: any) => o.name === existingSubOptions[i].name
        )
        if (!found) {
          if (debug)
            console.log(
              `[${path}] sub-option not found: ${existingSubOptions[i].name}`
            )
          return true
        }
        if (
          compareOptions(existingSubOptions[i], found, `${path}.${found.name}`)
        )
          return true
      }

      return false
    }

    for (const localOpt of localOptions) {
      const existingOpt = existingOptions.find(
        (o: any) => o.name === localOpt.name
      )
      if (!existingOpt) {
        if (debug)
          console.log(`[${local.name}] option not found: ${localOpt.name}`)
        return true
      }
      if (
        compareOptions(existingOpt, localOpt, `${local.name}.${localOpt.name}`)
      )
        return true
    }

    return false
  }
}

// Named exports for backward compatibility with require() destructuring
export const checkForUpdates = BotUtils.checkForUpdates.bind(BotUtils)
export const getImageFromMessage = BotUtils.getImageFromMessage.bind(BotUtils)
export const musicValidations = BotUtils.musicValidations
