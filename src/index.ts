// @root/src/index.ts

// register extenders
import '@helpers/extenders/Message'
import '@helpers/extenders/Guild'
import '@helpers/extenders/GuildChannel'

// Start health check server
import './services/health'

import { checkForUpdates } from '@helpers/BotUtils'
import { initializeMongoose } from '@src/database/mongoose'
import { BotClient } from '@src/structures'
import { validateConfiguration } from '@helpers/Validator'
import { secret } from '@src/config'

validateConfiguration()

// Declare client in global scope
let client: BotClient | undefined

async function initializeBot(): Promise<BotClient> {
  try {
    // initialize client
    client = new BotClient()

    // check for updates
    await checkForUpdates()

    // Initialize mongoose first
    await initializeMongoose()

    // Load commands and events
    await client.loadCommands('./src/commands')
    client.loadContexts('./src/contexts')
    client.loadEvents('./src/events')

    // start the client
    await client.login(secret.BOT_TOKEN)

    return client
  } catch (error) {
    if (client) {
      client.logger.error('Failed to initialize bot:', error)
    } else {
      console.error('Failed to initialize bot:', error)
    }
    process.exit(1)
  }
}

// Global error handling
process.on('unhandledRejection', (err: any) => {
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
