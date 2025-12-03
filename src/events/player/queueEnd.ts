import { MUSIC } from '@src/config'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import type { Player } from 'lavalink-client'

/**
 * Handles queue end events
 * @param {BotClient} client - The bot client instance
 * @param {Player} player - The player whose queue ended
 */
export default async (client: BotClient, player: Player): Promise<void> => {
  const guild = client.guilds.cache.get(player.guildId)
  if (!guild) return

  if (player.voiceChannelId) {
    await client.utils.setVoiceStatus(
      client,
      player.voiceChannelId,
      'Silence? Use /play to start the beat!'
    )
  }

  if (player.volume > 100) {
    await player.setVolume(MUSIC.DEFAULT_VOLUME)
  }

  const msg: any = player.get('message')
  if (msg && msg.deletable) {
    await msg.delete().catch(() => {})
  }

  const channel: any = player.textChannelId
    ? guild.channels.cache.get(player.textChannelId)
    : undefined
  if (channel) {
    await channel.safeSend(
      {
        embeds: [
          MinaEmbed.primary()
            .setTitle('queue concluded')
            .setDescription(
              `enjoying music with me? consider [voting](https://top.gg/bot/${client.user?.id}/vote) for me!`
            ),
        ],
      },
      10
    )
  }
}
