import type { BotClient } from '@src/structures'

/**
 * Raw event handler for Lavalink music manager
 * @param client - The bot client instance
 * @param data - The raw event data
 */
export default async (client: BotClient, data: any): Promise<void> => {
  if (client.musicManager) {
    client.musicManager.sendRawData(data)
  }
}
