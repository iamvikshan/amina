import { counterHandler, inviteHandler, presenceHandler } from '@src/handlers'
import { cleanupExpiredGuilds } from '@src/handlers/guildCleanup'
import { checkGuildReminders } from '@src/handlers/reminderScheduler'
import { cacheReactionRoles } from '@schemas/ReactionRoles'
import { getSettings } from '@schemas/Guild'
import { getPresenceConfig, getDevCommandsConfig } from '@schemas/Dev'
import { ApplicationCommandType, RateLimitError } from 'discord.js'
import type { BotClient } from '@src/structures'
import { aiResponderService } from '@src/services/aiResponder'
import { memoryService } from '@src/services/memoryService'
import { config } from '@src/config'

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

  // Initialize Music Manager
  if (client.config.MUSIC.ENABLED) {
    client.musicManager.init({ ...client.user!, shards: 'auto' })
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
        // Discord allows 5 updates/hour per application/guild, so max wait could be up to 1 hour
        // But we'll set a reasonable timeout of 30 seconds to detect issues
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

        // Check if result contains rate limit info (sometimes Discord.js includes it even on success)
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
            client.logger.error(
              `Discord allows only 5 command updates per hour per application/guild.`
            )
            client.logger.error(
              `If you've restarted your bot multiple times, you've likely hit this limit.`
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

          // Log full error details for debugging
          client.logger.warn(`Error code: ${error.code || 'N/A'}`)
          client.logger.warn(`Error status: ${error.status || 'N/A'}`)
          client.logger.warn(`Error message: ${error.message || 'N/A'}`)

          if (error.rateLimitData) {
            client.logger.warn(
              `Rate limit details: Limit=${error.rateLimitData.limit}, Remaining=${error.rateLimitData.remaining}, Reset=${new Date(error.rateLimitData.reset).toISOString()}`
            )
          }

          // Check for global rate limit
          if (error.global || error.headers?.['x-ratelimit-global']) {
            client.logger.error(
              '⚠️ GLOBAL RATE LIMIT HIT - All requests are rate limited!'
            )
          }

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
          client.logger.error(`Error code: ${error.code || 'N/A'}`)
          client.logger.error(`Error status: ${error.status || 'N/A'}`)
          if (error.stack) {
            client.logger.error(error.stack)
          }
          throw error
        }
      }
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
    const testGuild = client.guilds.cache.get(config.BOT.TEST_GUILD_ID || '')
    if (testGuild) {
      const testGuildCommands = client.slashCommands
        .filter(
          cmd =>
            // Keep test and dev commands
            cmd.testGuildOnly ||
            (cmd.devOnly && devConfig.ENABLED) ||
            // Only include regular commands if GLOBAL is true (include dmCommand - they're hybrid)
            (client.config.INTERACTIONS.GLOBAL &&
              !cmd.testGuildOnly &&
              !cmd.devOnly)
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
          await registerCommandsWithRetry(
            testGuildCommands,
            () => testGuild.commands.set(testGuildCommands),
            'test guild'
          )

          // Add delay between test guild and global command registration to avoid rate limits
          // Discord allows 5 updates per hour per application/guild
          client.logger.log(
            'Waiting 2 seconds before registering global commands to avoid rate limits...'
          )
          await new Promise(resolve => setTimeout(resolve, 2000))
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

      client.logger.log(
        `GLOBAL=true: Found ${globalCommands.length} commands to register globally (filtered from ${client.slashCommands.size} total commands)`
      )

      if (globalCommands.length > 0) {
        // Try global registration with shorter timeout (20s)
        let globalSuccess = false
        try {
          const globalTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  'Global command registration timeout after 20 seconds'
                )
              )
            }, 20000)
          })

          const startTime = Date.now()
          await Promise.race([
            client.application?.commands.set(globalCommands),
            globalTimeoutPromise,
          ])
          const duration = Date.now() - startTime
          client.logger.success(
            `Registered ${globalCommands.length} global commands (took ${duration}ms)`
          )
          globalSuccess = true
        } catch (error: any) {
          const isTimeout = error.message?.includes('timeout')

          if (isTimeout) {
            client.logger.warn(
              'Global command registration timed out (likely rate limited)'
            )
            client.logger.log(
              'Falling back to per-guild registration (each guild has separate rate limits)'
            )
          } else {
            // Not a timeout, might be a real error - log it
            client.logger.warn(
              `Global command registration failed: ${error.message || error}`
            )
            client.logger.log('Falling back to per-guild registration')
          }
        }

        // Fallback: Smart per-guild registration strategy (Runs in background to avoid blocking)
        if (!globalSuccess) {
          ;(async () => {
            const allGuilds = Array.from(client.guilds.cache.values()).filter(
              g => g.id !== config.BOT.TEST_GUILD_ID
            ) // Exclude test guild

            if (allGuilds.length === 0) {
              client.logger.warn(
                'No guilds to register commands in (excluding test guild)'
              )
              return
            }

            client.logger.log(
              `Registering commands in ${allGuilds.length} guilds (fallback mode) - Running in background`
            )

            let successCount = 0
            let failCount = 0
            const BATCH_SIZE = 5 // Parallelize in batches of 5

            for (let i = 0; i < allGuilds.length; i += BATCH_SIZE) {
              const batch = allGuilds.slice(i, i + BATCH_SIZE)
              const promises = batch.map(async guild => {
                try {
                  await guild.commands.set(globalCommands)
                  client.logger.success(
                    `✓ Registered commands in ${guild.name}`
                  )
                  return true
                } catch (error: any) {
                  client.logger.error(
                    `Failed to register commands in ${guild.name}: ${error.message}`
                  )
                  return false
                }
              })

              const results = await Promise.all(promises)
              successCount += results.filter(r => r).length
              failCount += results.filter(r => !r).length

              // Small delay between batches
              if (i + BATCH_SIZE < allGuilds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }

            client.logger.log(
              `Per-guild registration complete: ${successCount} succeeded, ${failCount} failed`
            )
          })().catch(err => {
            client.logger.error(
              'Error in background registration fallback:',
              err
            )
          })
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

  // Run reminder scheduler every hour
  // Checks for guilds that joined ~24 hours ago to send setup reminder
  setInterval(() => checkGuildReminders(client), 60 * 60 * 1000)

  // Run initial reminder check after a short delay
  setTimeout(() => checkGuildReminders(client), 2 * 60 * 1000)
}
