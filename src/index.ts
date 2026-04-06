// @root/src/index.ts

// register extenders
import '@helpers/extenders/Message'
import '@helpers/extenders/Guild'
import '@helpers/extenders/GuildChannel'

import { checkForUpdates } from '@helpers/BotUtils'
import { disconnectMongoose, initializeMongoose } from '@src/database/mongoose'
import { startHealthServer, stopHealthServer } from '@src/services/health'
import { BotClient } from '@src/structures'
import { validateConfiguration } from '@helpers/Validator'
import { secret } from '@src/config'

validateConfiguration()

// Declare client in global scope
let client: BotClient | undefined
let isShuttingDown = false

async function logShutdownError(message: string, err: unknown): Promise<void> {
  if (client) {
    client.logger.error(message, err)
    return
  }

  try {
    const { default: Logger } = await import('@helpers/Logger')
    Logger.error(message, err)
  } catch {
    console.error(message, err)
  }
}

async function coordinateShutdown(
  _signal: 'SIGTERM' | 'SIGINT'
): Promise<void> {
  if (isShuttingDown) return

  isShuttingDown = true
  let exitCode = 0

  try {
    const healthStopResult = await stopHealthServer()

    if (!healthStopResult.ok) {
      exitCode = 1
      await logShutdownError(
        'Health server failed to stop cleanly',
        healthStopResult.error
      )
    }

    if (client) {
      try {
        await client.destroy()
      } catch (err) {
        exitCode = 1
        await logShutdownError(
          'Failed to destroy Discord client during shutdown',
          err
        )
      }
    }

    try {
      await disconnectMongoose()
    } catch (err) {
      exitCode = 1
      await logShutdownError(
        'Failed to disconnect mongoose during shutdown',
        err
      )
    }
  } finally {
    process.exit(exitCode)
  }
}

process.on('SIGTERM', () => {
  void coordinateShutdown('SIGTERM')
})

process.on('SIGINT', () => {
  void coordinateShutdown('SIGINT')
})

async function initializeBot(): Promise<BotClient> {
  try {
    // Start health check server early for container probes
    await startHealthServer()

    // initialize client
    client = new BotClient()

    // check for updates
    await checkForUpdates()

    // Initialize mongoose first
    await initializeMongoose()

    // Load commands and events
    await client.loadCommands('./src/commands')
    await client.loadContexts('./src/contexts')
    await client.loadEvents('./src/events')

    // start the client
    await client.login(secret.BOT_TOKEN)

    return client
  } catch (error) {
    // Logger may not be available if config failed to load
    try {
      const { default: Logger } = await import('@helpers/Logger')
      Logger.error('Failed to initialize bot:', error)
    } catch {
      console.error('Failed to initialize bot:', error)
    }
    process.exit(1)
  }
}

// Global error handling
process.on('unhandledRejection', (err: unknown) => {
  if (client) {
    client.logger.error('Unhandled Rejection:', err)
  } else {
    console.error('Unhandled Rejection:', err)
  }
})

process.on('uncaughtException', (err: Error) => {
  if (client) {
    client.logger.error('Uncaught Exception:', err)
  } else {
    console.error('Uncaught Exception:', err)
  }
})

// Initialize the bot
initializeBot().catch(error => {
  console.error('Failed to start bot:', error)
  process.exit(1)
})
