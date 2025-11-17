import { counterHandler, inviteHandler, presenceHandler } from '@src/handlers'
import { cacheReactionRoles } from '@schemas/ReactionRoles'
import { getSettings } from '@schemas/Guild'
import { getPresenceConfig, getDevCommandsConfig } from '@schemas/Dev'
import { ApplicationCommandType } from 'discord.js'
import type { BotClient } from '@src/structures'
import { aiResponderService } from '@src/services/aiResponder'
import { memoryService } from '@src/services/memoryService'

/**
 * Client ready event handler
 * @param client - The bot client instance
 */
export default async (client: BotClient): Promise<void> => {
  client.logger.success(`Logged in as ${client.user.tag}! (${client.user.id})`)

  // Initialize AI Responder Service
  await aiResponderService.initialize()
  client.logger.success('AI Responder Service initialized')

  // Initialize Memory Service
  const { configCache } = await import('@src/config/aiResponder')
  try {
    const config = await configCache.getConfig()
    if (config.geminiKey && config.upstashUrl && config.upstashToken) {
      await memoryService.initialize(
        config.geminiKey,
        config.upstashUrl,
        config.upstashToken
      )
      client.logger.success('Memory Service initialized')
    } else {
      client.logger.warn('Memory Service disabled - missing configuration')
    }
  } catch (error) {
    client.logger.warn('Memory Service disabled - configuration error')
  }

  // Register autocomplete providers
  const { registerReloadAutocomplete } = await import('@handlers/dev/reload')
  registerReloadAutocomplete()
  client.logger.success('Autocomplete providers registered')

  // Initialize Music Manager
  if (client.config.MUSIC.ENABLED) {
    client.musicManager.init({ ...client.user, shards: 'auto' })
    client.logger.success('Music Manager initialized')
  }

  // Initialize Giveaways Manager
  if (client.config.GIVEAWAYS.ENABLED) {
    client.logger.log('Initializing the giveaways manager...')
    client.giveawaysManager
      ._init()
      .then(() => client.logger.success('Giveaway Manager is up and running!'))
  }

  // Initialize Presence Handler
  const presenceConfig = await getPresenceConfig()
  if (presenceConfig.PRESENCE.ENABLED) {
    await presenceHandler(client)

    const logPresence = () => {
      let message = presenceConfig.PRESENCE.MESSAGE

      // Process {servers} and {members} placeholders
      if (message.includes('{servers}')) {
        message = message.replaceAll(
          '{servers}',
          String(client.guilds.cache.size)
        )
      }

      if (message.includes('{members}')) {
        const members = client.guilds.cache
          .map(g => g.memberCount)
          .reduce((partial_sum, a) => partial_sum + a, 0)
        message = message.replaceAll('{members}', String(members))
      }

      client.logger.log(
        `Presence: STATUS:${presenceConfig.PRESENCE.STATUS}, TYPE:${presenceConfig.PRESENCE.TYPE}`
      )
    }

    // Log the initial presence update when the bot starts
    logPresence()
  }

  // Register Interactions
  if (client.config.INTERACTIONS.SLASH || client.config.INTERACTIONS.CONTEXT) {
    const devConfig = await getDevCommandsConfig()

    // Register DM commands (always, independent of GLOBAL setting)
    const dmCommands = client.slashCommands
      .filter(cmd => cmd.dmCommand)
      .map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        type: ApplicationCommandType.ChatInput,
        options: cmd.slashCommand.options,
        dm_permission: true, // Available in DMs
      }))

    if (dmCommands.length > 0) {
      // Register DM commands globally (they'll be available in DMs)
      await client.application.commands.set(dmCommands)
      client.logger.success(
        `Registered ${dmCommands.length} DM commands (available in DMs)`
      )
    }

    // Register test guild commands
    const testGuild = client.guilds.cache.get(process.env.TEST_GUILD_ID)
    if (testGuild) {
      const testGuildCommands = client.slashCommands
        .filter(
          cmd =>
            // Commands with testGuildOnly flag
            cmd.testGuildOnly ||
            // Dev commands if enabled
            (cmd.devOnly && devConfig.ENABLED) ||
            // If GLOBAL is false, only register testGuildOnly commands in test guild
            // If GLOBAL is true, also include regular commands (but exclude dmCommand-only commands)
            (client.config.INTERACTIONS.GLOBAL &&
              !cmd.testGuildOnly &&
              !cmd.devOnly &&
              !cmd.dmCommand)
        )
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false, // Respect dmCommand flag
        }))

      if (testGuildCommands.length > 0) {
        await testGuild.commands.set(testGuildCommands)
        client.logger.success(
          `Registered ${testGuildCommands.length} test guild commands`
        )
      }
    }

    // Register global commands (only if GLOBAL is true)
    if (client.config.INTERACTIONS.GLOBAL) {
      const globalCommands = client.slashCommands
        .filter(
          cmd =>
            // Exclude test-only, dev-only, and dmCommand-only commands
            !cmd.testGuildOnly && !cmd.devOnly && !cmd.dmCommand
        )
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
          dm_permission: false, // Guild-only commands
        }))

      if (globalCommands.length > 0) {
        await client.application.commands.set(globalCommands)
        client.logger.success(
          `Registered ${globalCommands.length} global commands`
        )
      }
    } else {
      // If GLOBAL is false, only keep DM commands globally
      // (DM commands are already registered above, this ensures we don't have other commands)
      if (dmCommands.length > 0) {
        await client.application.commands.set(dmCommands)
        client.logger.success(
          `Cleared global commands (GLOBAL=false), kept ${dmCommands.length} DM commands`
        )
      } else {
        // No DM commands, clear all
        await client.application.commands.set([])
        client.logger.success(
          'Cleared all global commands (GLOBAL=false, no DM commands)'
        )
      }
    }
  }

  // Load reaction roles to cache
  await cacheReactionRoles(client)

  for (const guild of client.guilds.cache.values()) {
    const settings = await getSettings(guild)

    // Initialize counter
    if (settings.counters.length > 0) {
      await counterHandler.init(guild, settings)
    }

    // Cache invites
    if (settings.invite.tracking) {
      inviteHandler.cacheGuildInvites(guild)
    }
  }

  setInterval(
    () => counterHandler.updateCounterChannels(client),
    10 * 60 * 1000
  )
}
