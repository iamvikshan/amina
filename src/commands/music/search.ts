import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js'
import config from '@src/config'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'search',
  description: 'search for matching songs on YouTube',
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
      return await interaction.followUp('🚫 Please provide a search query')
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
): Promise<string | { embeds: EmbedBuilder[] } | null> {
  if (!member.voice.channel) return '🚫 You need to join a voice channel first'

  let player = guild.client.musicManager.getPlayer(guild.id)

  if (player && member.voice.channel !== guild.members.me.voice.channel) {
    return '🚫 You must be in the same voice channel as me.'
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
      return '🚫 Failed to connect to voice channel'
    }
  }

  const res = await player.search({ query }, member.user)

  if (!res || !res.tracks?.length) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(config.EMBED_COLORS.ERROR)
          .setDescription(`No results found for \`${query}\``),
      ],
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
      .setPlaceholder('Choose Search Results')
      .setMaxValues(1)
      .addOptions(options)
  )

  const searchEmbed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: 'Search Results' })
    .setDescription(`Select the song you wish to add to the queue`)

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
      return '🚫 Invalid selection'
    }

    const selectedTrack = results[selectedIndex]
    player.queue.add(selectedTrack)

    const trackEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Added Track to queue' })
      .setDescription(
        `[${selectedTrack.info.title}](${selectedTrack.info.uri})`
      )
      .setThumbnail(selectedTrack.info.artworkUrl)
      .addFields({
        name: 'Song Duration',
        value:
          '`' +
          guild.client.utils.formatTime(selectedTrack.info.duration) +
          '`',
        inline: true,
      })
      .setFooter({ text: `Requested By: ${member.user.username}` })

    if (!player.playing && player.queue.tracks.length > 0) {
      await player.play({ paused: false })
    }

    return { embeds: [trackEmbed] }
  } catch (err: any) {
    console.error('Error handling response:', err)
    await searchMessage.delete().catch(() => {})
    return '🚫 Failed to register your response'
  }
}

export default command
