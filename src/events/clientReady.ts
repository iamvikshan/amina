import { counterHandler, inviteHandler, presenceHandler } from '@src/handlers'
import { cleanupExpiredGuilds } from '@src/handlers/guildCleanup'
import { checkGuildReminders } from '@src/handlers/reminderScheduler'
import { checkUserReminders } from '@src/handlers/userReminderScheduler'
import { cacheReactionRoles } from '@schemas/ReactionRoles'
import { getSettings } from '@schemas/Guild'
import { getPresenceConfig, getDevCommandsConfig } from '@schemas/Dev'
import { ApplicationCommandType, RateLimitError } from 'discord.js'
import type { BotClient } from '@src/structures'
import { aiResponderService } from '@src/services/aiResponder'
import { aiCommandRegistry } from '@src/services/aiCommandRegistry'
import { memoryService } from '@src/services/memoryService'
import { config } from '@src/config'
import BotUtils from '../helpers/BotUtils'

/**
 * Client ready event handler
 * @param client - The bot client instance
 */
export default async (client: BotClient): Promise<void> => {
  client.logger.success(
    `Logged in as ${client.user?.tag}! (${client.user?.id})`
  )

  // Initialize AI Responder Service
  await aiResponderService.initialize()
  // client.logger.success('AI Responder Service initialized')

  // Initialize AI Command Registry
  aiCommandRegistry.initialize(client)
  client.logger.success('AI Command Registry initialized')

  // Initialize Memory Service
  const { configCache } = await import('@src/config/aiResponder')
  try {
    const config = await configCache.getConfig()
    if (config.geminiKey && config.upstashUrl && config.upstashToken) {
      await memoryService.initialize(
        config.geminiKey,
        config.upstashUrl,
        config.upstashToken,
        config.embeddingModel,
        config.extractionModel
      )
      //  client.logger.success('Memory Service initialized')
    } else {
      client.logger.warn('Memory Service disabled - missing configuration')
    }
  } catch (error: any) {
    client.logger.warn(
      `Memory Service disabled - configuration error: ${error.message || error}`
    )
  }

  // Initialize Music Manager
  if (client.config.MUSIC.ENABLED) {
    if (client.user) {
      client.musicManager.init({ ...client.user, shards: 'auto' })
      client.logger.success('Music Manager initialized')
    } else {
      client.logger.warn(
        'Music Manager initialization skipped - client user not available'
      )
    }
  }

  // Initialize Giveaways Manager
  if (client.config.GIVEAWAYS.ENABLED) {
    //   client.logger.log('Initializing the giveaways manager...')
    client.giveawaysManager
      ._init()
      .then(() => client.logger.success('Giveaway Manager is up and running!'))
  }

  // Initialize Presence Handler
  const presenceConfig = await getPresenceConfig()
  if (presenceConfig.PRESENCE.ENABLED) {
    await presenceHandler(client)
    client.logger.success('Presence Handler initialized')
  }

  // Helper function to handle command registration with rate limit detection
  const registerCommandsWithRetry = async (
    commands: any[],
    registerFn: () => Promise<any>,
    commandType: string,
    maxRetries = 3
  ): Promise<void> => {
    if (commands.length === 0) {
      client.logger.log(`No ${commandType} commands to register`)
      return
    }

    client.logger.log(
      `Attempting to register ${commands.length} ${commandType} commands...`
    )

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now()

        // Add timeout to detect if Discord.js is hanging (waiting for rate limit)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                'Command registration timeout after 30 seconds - likely rate limited'
              )
            )
          }, 30000)
        })

        const result = await Promise.race([registerFn(), timeoutPromise])
        const duration = Date.now() - startTime

        // Log success with timing
        client.logger.success(
          `Registered ${commands.length} ${commandType} commands (took ${duration}ms)`
        )

        // Check if result contains rate limit info
        if (result && typeof result === 'object') {
          if (result.rateLimitData) {
            client.logger.log(
              `Rate limit status: Limit=${result.rateLimitData.limit}, Remaining=${result.rateLimitData.remaining}`
            )
          }
        }

        return
      } catch (error: any) {
        // Check for timeout (likely rate limited and Discord.js is queuing)
        const isTimeout =
          error.message?.includes('timeout') ||
          error.message?.includes('timeout after')

        const isRateLimit =
          error instanceof RateLimitError ||
          error.code === 429 ||
          error.status === 429 ||
          error.message?.includes('rate limit') ||
          error.message?.includes('429') ||
          isTimeout

        if (isRateLimit || isTimeout) {
          if (isTimeout) {
            client.logger.error(
              `⏱️ TIMEOUT: Command registration hung for 30+ seconds (attempt ${attempt}/${maxRetries})`
            )
            client.logger.error(
              `This usually means Discord.js is internally queuing due to rate limits.`
            )
          }

          const retryAfter =
            error.retryAfter ||
            error.retry_after ||
            (error.rateLimitData?.retryAfter ?? 3600000) || // Default to 1 hour if timeout
            3600000
          const retryAfterSeconds = Math.ceil(retryAfter / 1000)
          const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60)

          client.logger.warn(
            `⚠️ RATE LIMITED when registering ${commandType} commands (attempt ${attempt}/${maxRetries})`
          )
          client.logger.warn(
            `Rate limit info: Retry after ${retryAfterSeconds}s (${retryAfterMinutes} minutes)`
          )

          if (attempt < maxRetries) {
            const waitTime = retryAfter || Math.pow(2, attempt) * 1000 // Exponential backoff fallback
            client.logger.log(
              `Waiting ${Math.ceil(waitTime / 1000)}s before retry...`
            )
            await new Promise(resolve => setTimeout(resolve, waitTime))
          } else {
            client.logger.error(
              `❌ Failed to register ${commandType} commands after ${maxRetries} attempts due to rate limiting`
            )
            throw error
          }
        } else {
          // Not a rate limit error, log and throw
          client.logger.error(
            `❌ Failed to register ${commandType} commands: ${error.message || error}`
          )
          throw error
        }
      }
    }
  }

  // Helper to check if commands need update
  // Returns: { needsUpdate: boolean, changedCommands: string[] }
  const shouldUpdateCommands = async (
    localCommands: any[],
    fetchFn: () => Promise<any>,
    commandType = 'commands'
  ): Promise<{ needsUpdate: boolean; changedCommands: string[] }> => {
    const changedCommands: string[] = []

    try {
      const existingCommands = await fetchFn()
      if (existingCommands.size !== localCommands.length) {
        client.logger.log(
          `[${commandType}] Count differs: ${existingCommands.size} existing vs ${localCommands.length} local`
        )
        return { needsUpdate: true, changedCommands: ['(count mismatch)'] }
      }

      for (const localCmd of localCommands) {
        const existingCmd = existingCommands.find(
          (c: any) => c.name === localCmd.name
        )
        if (!existingCmd) {
          changedCommands.push(`+${localCmd.name}`)
          continue
        }
        if (BotUtils.areCommandsDifferent(existingCmd, localCmd)) {
          changedCommands.push(localCmd.name)
        }
      }

      if (changedCommands.length > 0) {
        client.logger.log(
          `[${commandType}] ${changedCommands.length} command(s) changed: ${changedCommands.join(', ')}`
        )
        return { needsUpdate: true, changedCommands }
      }

      return { needsUpdate: false, changedCommands: [] }
    } catch (error) {
      client.logger.warn(
        `Failed to fetch existing commands for diffing: ${error}`
      )
      return { needsUpdate: true, changedCommands: ['(fetch error)'] } // Force update on error
    }
  }

  // Register Interactions
  if (client.config.INTERACTIONS.SLASH || client.config.INTERACTIONS.CONTEXT) {
    const devConfig = await getDevCommandsConfig()

    if (!client.config.INTERACTIONS.GLOBAL) {
      // Clear all global commands when GLOBAL is false
      try {
        await client.application?.commands.set([])
        client.logger.success('Cleared all global commands (GLOBAL=false)')
      } catch (error: any) {
        const isRateLimit =
          error instanceof RateLimitError ||
          error.code === 429 ||
          error.status === 429
        if (isRateLimit) {
          const retryAfter =
            error.retryAfter ||
            error.retry_after ||
            (error.rateLimitData?.retryAfter ?? 0)
          client.logger.warn(
            `Rate limited when clearing global commands. Retry after ${Math.ceil(retryAfter / 1000)}s`
          )
        } else {
          client.logger.error(
            `Failed to clear global commands: ${error.message || error}`
          )
        }
      }
    }

    // Register test guild commands (Wrapped in try-catch to prevent startup crash)
    // Only register devOnly and testGuildOnly commands here - regular commands come from global registration
    const testGuild = client.guilds.cache.get(config.BOT.TEST_GUILD_ID || '')
    if (testGuild) {
      const testGuildCommands = client.slashCommands
        .filter(
          cmd =>
            // Only dev and test commands - regular commands come from global registration
            cmd.testGuildOnly || (cmd.devOnly && devConfig.ENABLED)
        )
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false, // dmCommand commands are available in DMs
        }))

      if (testGuildCommands.length > 0) {
        try {
          const { needsUpdate, changedCommands } = await shouldUpdateCommands(
            testGuildCommands,
            () => testGuild.commands.fetch(),
            'test guild'
          )

          if (needsUpdate) {
            await registerCommandsWithRetry(
              testGuildCommands,
              () => testGuild.commands.set(testGuildCommands),
              `test guild (${changedCommands.length} changed: ${changedCommands.join(', ')})`
            )

            // Add delay between test guild and global command registration to avoid rate limits
            client.logger.log(
              'Waiting 2 seconds before registering global commands to avoid rate limits...'
            )
            await new Promise(resolve => setTimeout(resolve, 2000))
          } else {
            client.logger.success(
              'Test guild commands are up to date. Skipping registration.'
            )
          }
        } catch (error: any) {
          client.logger.error(
            `Failed to register test guild commands: ${error.message}`
          )
        }
      }
    }

    // Register global commands
    if (client.config.INTERACTIONS.GLOBAL) {
      const globalCommands = client.slashCommands
        .filter(cmd => !cmd.testGuildOnly && !cmd.devOnly)
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false, // dmCommand commands are hybrid (available in both guilds and DMs)
        }))

      // client.logger.log(
      //   `GLOBAL=true: Found ${globalCommands.length} commands to register globally (filtered from ${client.slashCommands.size} total commands)`
      // )

      if (globalCommands.length > 0) {
        try {
          const { needsUpdate, changedCommands } = await shouldUpdateCommands(
            globalCommands,
            () =>
              client.application?.commands.fetch() ??
              Promise.resolve(new Map()),
            'global'
          )

          if (needsUpdate) {
            const globalTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                reject(
                  new Error(
                    'Global command registration timeout after 30 seconds'
                  )
                )
              }, 30000)
            })

            const startTime = Date.now()
            await Promise.race([
              client.application?.commands.set(globalCommands),
              globalTimeoutPromise,
            ])
            const duration = Date.now() - startTime
            client.logger.success(
              `Synced ${globalCommands.length} global commands (${changedCommands.length} changed: ${changedCommands.join(', ')}) (took ${duration}ms)`
            )
          } else {
            client.logger.success(
              'Global commands are up to date. Skipping registration.'
            )
          }
        } catch (error: any) {
          // Log the error but don't fallback to per-guild registration
          // Per-guild registration causes duplicates when global commands eventually propagate
          client.logger.error(
            `Failed to register global commands: ${error.message || error}`
          )
          client.logger.warn(
            'Global commands may take up to 1 hour to propagate. Do not use per-guild fallback to avoid duplicates.'
          )
        }
      } else {
        client.logger.warn(
          'GLOBAL=true but no global commands to register (all commands are testGuildOnly or devOnly)'
        )
      }
    } else {
      client.logger.log('GLOBAL=false: Skipping global command registration')
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

  // Run guild cleanup daemon every hour
  // Cleans up guilds that left more than 24 hours ago
  setInterval(() => cleanupExpiredGuilds(client), 60 * 60 * 1000)

  // Run initial cleanup on startup (after a short delay to let everything initialize)
  setTimeout(() => cleanupExpiredGuilds(client), 1 * 60 * 1000) // 1 minute after startup

  // Run guild join reminder scheduler every hour
  // Checks for guilds that joined ~24 hours ago to send setup reminder
  setInterval(() => checkGuildReminders(client), 60 * 60 * 1000)

  // Run initial reminder check after a short delay
  setTimeout(() => checkGuildReminders(client), 2 * 60 * 1000)

  // Run user reminder scheduler
  // Checks for due user reminders and sends notifications
  setInterval(() => checkUserReminders(client), 60000) // 60 seconds

  // Run initial check after a short delay
  setTimeout(() => checkUserReminders(client), 5 * 1000) // 5 seconds after startup
}
