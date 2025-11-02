import type { BotClient } from '@src/structures'

/**
 * Warning event handler
 * @param client - The bot client instance
 * @param message - The warning message
 */
export default async (client: BotClient, message: string): Promise<void> => {
  client.logger.warn(`Client Warning: ${message}`)
}
