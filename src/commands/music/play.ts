import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import config from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'play',
  description: 'play a song by name or url from youtube, spotify, and more',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'query',
        description: 'song name or url',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const searchQuery = interaction.options.getString('query')
    if (!searchQuery) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('music.error.provideSong'))],
      })
      return
    }

    const member = interaction.member as any
    const guild = interaction.guild as any
    const channel = interaction.channel as any

    const response = await play({ member, guild, channel }, searchQuery)
    await interaction.followUp(response)
  },
}

async function play(
  {
    member,
    guild,
    channel,
  }: {
    member: any
    guild: any
    channel: any
  },
  searchQuery: string
): Promise<string | { embeds: MinaEmbed[] }> {
  if (!member.voice.channel) {
    return { embeds: [MinaEmbed.error(mina.say('music.error.notInVoice'))] }
  }

  let player = guild.client.musicManager.getPlayer(guild.id)

  if (player && member.voice.channel !== guild.members.me.voice.channel) {
    return {
      embeds: [MinaEmbed.error(mina.say('music.error.differentChannel'))],
    }
  }

  if (!player) {
    player = await guild.client.musicManager.createPlayer({
      guildId: guild.id,
      voiceChannelId: member.voice.channel.id,
      textChannelId: channel.id,
      selfMute: false,
      selfDeaf: true,
      volume: config.MUSIC.DEFAULT_VOLUME,
    })
  }

  if (!player.connected) {
    try {
      await player.connect()
    } catch (error: any) {
      guild.client.logger?.error('Player Connect Error', error)
      return {
        embeds: [MinaEmbed.error(mina.say('music.error.connectFailed'))],
      }
    }
  }

  try {
    const res = await player.search({ query: searchQuery }, member.user)

    if (!res || res.loadType === 'empty') {
      return {
        embeds: [
          MinaEmbed.error(
            mina.sayf('music.error.noResults', { query: searchQuery })
          ),
        ],
      }
    }

    switch (res?.loadType) {
      case 'error':
        guild.client.logger?.error('Search Exception', res.exception)
        return { embeds: [MinaEmbed.error(mina.say('music.error.loadFailed'))] }

      case 'playlist': {
        player.queue.add(res.tracks)

        const playlistEmbed = MinaEmbed.success()
          .setAuthor({ name: mina.say('music.success.queued.playlist') })
          .setThumbnail(res.playlist.thumbnail)
          .setDescription(`[${res.playlist.name}](${res.playlist.uri})`)
          .addFields(
            {
              name: 'tracks',
              value: `${res.tracks.length} ${mina.say('music.success.songs')}`,
              inline: true,
            },
            {
              name: 'duration',
              value:
                '`' +
                guild.client.utils.formatTime(
                  res.tracks
                    .map((t: any) => t.info.duration)
                    .reduce((a: number, b: number) => a + b, 0)
                ) +
                '`',
              inline: true,
            }
          )
          .setFooter({
            text: mina.sayf('generic.requestedBy', {
              user: member.user.username,
            }),
          })

        if (!player.playing && player.queue.tracks.length > 0) {
          await player.play({ paused: false })
        }

        return { embeds: [playlistEmbed] }
      }

      case 'track':
      case 'search': {
        const track = res.tracks[0]
        player.queue.add(track)

        const trackEmbed = MinaEmbed.success()
          .setAuthor({ name: mina.say('music.success.queued.track') })
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .setThumbnail(track.info.artworkUrl)
          .addFields({
            name: 'duration',
            value:
              '`' + guild.client.utils.formatTime(track.info.duration) + '`',
            inline: true,
          })
          .setFooter({
            text: mina.sayf('generic.requestedBy', {
              user: track.requester.username,
            }),
          })

        if (player.queue?.tracks?.length > 1) {
          trackEmbed.addFields({
            name: 'position',
            value: player.queue.tracks.length.toString(),
            inline: true,
          })
        }

        if (!player.playing && player.queue.tracks.length > 0) {
          await player.play({ paused: false })
        }

        return { embeds: [trackEmbed] }
      }

      default:
        guild.client.logger?.debug('Unknown loadType', res)
        return { embeds: [MinaEmbed.error(mina.say('music.error.loadFailed'))] }
    }
  } catch (error: any) {
    guild.client.logger?.error('Search Exception', JSON.stringify(error))
    return { embeds: [MinaEmbed.error(mina.say('music.error.loadFailed'))] }
  }
}

export default command
