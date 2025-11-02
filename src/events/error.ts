import type { BotClient } from '@src/structures'

/**
 * Error event handler
 * @param client - The bot client instance
 * @param error - The error that occurred
 */
export default async (client: BotClient, error: Error): Promise<void> => {
  client.logger.error(`Client Error`, error)
}
