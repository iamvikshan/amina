import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js'
import config from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'search',
  description: 'search for matching songs on youtube',
  category: 'MUSIC',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'query',
        description: 'song to search',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query')
    if (!query) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('music.error.provideQuery'))],
      })
      return
    }

    const member = interaction.member as any
    const guild = interaction.guild as any
    const channel = interaction.channel as any

    const response = await search({ member, guild, channel }, query)
    if (response) await interaction.followUp(response)
    else interaction.deleteReply()
  },
}

async function search(
  {
    member,
    guild,
    channel,
  }: {
    member: any
    guild: any
    channel: any
  },
  query: string
): Promise<string | { embeds: MinaEmbed[] } | null> {
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

  const res = await player.search({ query }, member.user)

  if (!res || !res.tracks?.length) {
    return {
      embeds: [MinaEmbed.error(mina.sayf('music.error.noResults', { query }))],
    }
  }

  let maxResults = config.MUSIC.MAX_SEARCH_RESULTS
  if (res.tracks.length < maxResults) maxResults = res.tracks.length

  const results = res.tracks.slice(0, maxResults)
  const options = results.map((track: any, index: number) => ({
    label: track.info.title,
    value: index.toString(),
  }))

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('search-results')
      .setPlaceholder('pick a song')
      .setMaxValues(1)
      .addOptions(options)
  )

  const searchEmbed = MinaEmbed.info()
    .setAuthor({ name: mina.say('music.success.searchResults') })
    .setDescription(mina.say('music.success.selectSong'))

  const searchMessage = await channel.send({
    embeds: [searchEmbed],
    components: [menuRow],
  })

  try {
    const response = await channel.awaitMessageComponent({
      filter: (i: any) =>
        i.user.id === member.id && i.message.id === searchMessage.id,
      componentType: ComponentType.StringSelect,
      idle: 30 * 1000,
    })

    if (response.customId !== 'search-results') {
      await searchMessage.delete()
      return null
    }

    await searchMessage.delete()

    const selectedIndex = parseInt(response.values[0])
    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= results.length
    ) {
      return {
        embeds: [MinaEmbed.error(mina.say('music.error.invalidSelection'))],
      }
    }

    const selectedTrack = results[selectedIndex]
    player.queue.add(selectedTrack)

    const trackEmbed = MinaEmbed.success()
      .setAuthor({ name: mina.say('music.success.queued.track') })
      .setDescription(
        `[${selectedTrack.info.title}](${selectedTrack.info.uri})`
      )
      .setThumbnail(selectedTrack.info.artworkUrl)
      .addFields({
        name: 'duration',
        value:
          '`' +
          guild.client.utils.formatTime(selectedTrack.info.duration) +
          '`',
        inline: true,
      })
      .setFooter({
        text: mina.sayf('generic.requestedBy', { user: member.user.username }),
      })

    if (!player.playing && player.queue.tracks.length > 0) {
      await player.play({ paused: false })
    }

    return { embeds: [trackEmbed] }
  } catch (err: any) {
    console.error('Error handling response:', err)
    await searchMessage.delete().catch(() => {})
    return { embeds: [MinaEmbed.error(mina.say('music.error.timeout'))] }
  }
}

export default command
