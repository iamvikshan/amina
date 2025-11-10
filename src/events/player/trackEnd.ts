import { autoplayFunction } from '@handlers/player'
import { MUSIC } from '@src/config'
import type { BotClient } from '@src/structures'
import type { Player, Track } from 'lavalink-client'

/**
 * Handles track end events
 * @param {BotClient} client - The bot client instance
 * @param {Player} player - The player instance
 * @param {Track} track - The track that ended
 */
export default async (
  client: BotClient,
  player: Player,
  track: Track
): Promise<void> => {
  const guild = client.guilds.cache.get(player.guildId)
  if (!guild) return

  if (player.volume > 100) {
    await player.setVolume(MUSIC.DEFAULT_VOLUME)
  }

  const msg: any = player.get('message')
  if (msg && msg.deletable) {
    await msg.delete().catch(() => {})
  }

  if (player.get('autoplay') === true) {
    await autoplayFunction(client, track, player)
  }
}
