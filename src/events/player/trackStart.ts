import { ActionRowBuilder } from 'discord.js'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'
import type { Player, Track } from 'lavalink-client'

/**
 * Handles track start events
 * @param {BotClient} client - The bot client instance
 * @param {Player} player - The player instance
 * @param {Track} track - The track that started
 */
export default async (
  client: BotClient,
  player: Player,
  track: Track
): Promise<void> => {
  const guild = client.guilds.cache.get(player.guildId)
  if (!guild) return

  if (!player.textChannelId || !track) return

  const channel: any = guild.channels.cache.get(player.textChannelId)
  if (!channel) return

  if (player.get('autoplay') === true) {
    await player.queue.previous.push(track)
  }

  if (player.voiceChannelId) {
    await client.utils.setVoiceStatus(
      client,
      player.voiceChannelId,
      `Paying: **${track.info.title}**`
    )
  }

  const previous = await player.queue.shiftPrevious()

  const row = (player: Player) =>
    new ActionRowBuilder().addComponents(
      MinaButtons.prev('previous', !previous),
      player.paused
        ? MinaButtons.go('pause')
        : MinaButtons.custom('pause', 'pause', 2),
      MinaButtons.stop('stop'),
      MinaButtons.next('skip'),
      MinaButtons.custom('shuffle', 'shuffle', 2)
    )

  const msg: any = await channel.safeSend({
    embeds: [
      MinaEmbed.primary()
        .setAuthor({ name: mina.say('music.nowPlaying.title') })
        .setDescription(
          mina.sayf('music.nowPlaying.description', {
            title: track.info.title,
            uri: track.info.uri,
          })
        )
        .setThumbnail(track.info.artworkUrl)
        .setFooter({
          text: mina.sayf('music.nowPlaying.requestedBy', {
            user: (track.requester as any).username,
          }),
        })
        .addFields(
          {
            name: 'duration',
            value: track.info.isStream
              ? 'live'
              : client.utils.formatTime(track.info.duration),
            inline: true,
          },
          {
            name: 'author',
            value: track.info.author || 'unknown',
            inline: true,
          }
        ),
    ],
    components: [row(player)],
  })

  if (msg) player.set('message', msg)

  const collector = msg.createMessageComponentCollector({
    filter: async (int: any) => {
      const sameVc =
        int.guild.members.me.voice.channelId === int.member.voice.channelId
      return sameVc
    },
  })

  collector.on('collect', async (int: any) => {
    if (!int.isButton()) return

    await int.deferReply({ ephemeral: true })
    let description: string = ''

    switch (int.customId) {
      case 'previous':
        description = previous
          ? mina.say('music.controls.previous')
          : mina.say('music.controls.noPrevious')
        if (previous) player.play({ clientTrack: previous })
        break

      case 'pause':
        if (player.paused) {
          player.resume()
          description = mina.say('music.controls.resumed')
        } else {
          player.pause()
          description = mina.say('music.controls.paused')
        }
        await msg.edit({ components: [row(player)] })
        break

      case 'stop':
        player.stopPlaying(true, false)
        description = mina.say('music.controls.stopped')
        break

      case 'skip':
        description =
          player.queue.tracks.length > 0
            ? mina.say('music.controls.skipped')
            : mina.say('music.controls.queueEmpty')
        if (player.queue.tracks.length > 0) player.skip()
        break

      case 'shuffle':
        if (player.queue.tracks.length < 2) {
          description = mina.say('music.controls.tooShort')
        } else {
          player.queue.shuffle()
          description = mina.say('music.controls.shuffled')
        }
        break
    }
    await int.followUp({
      embeds: [MinaEmbed.primary().setDescription(description)],
    })
  })
}
