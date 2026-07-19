import type { BotClient } from '@src/structures'

/**
 * Raw event handler for Lavalink music manager
 * @param {BotClient} client - The bot client instance
 * @param {any} data - The raw event data
 * @returns {void} Nothing.
 */
export default async (client: BotClient, data: any): Promise<void> => {
  if (client.musicManager) {
    client.musicManager.sendRawData(data)
  }
}
