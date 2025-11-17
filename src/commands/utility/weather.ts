import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { MESSAGES, EMBED_COLORS } from '@src/config'
import { getJson } from '@helpers/HttpUtils'
import type { Command } from '@structures/Command'

const API_KEY = process.env.WEATHERSTACK_KEY

const command: Command = {
  name: 'weather',
  description: 'get weather information',
  cooldown: 5,
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],
  testGuildOnly: true,

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'place',
        description: 'country/city name to get weather information for',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const place = interaction.options.getString('place', true)
    const response = await weather(place)
    await interaction.followUp(response)
  },
}

async function weather(
  place: string
): Promise<{ embeds: EmbedBuilder[] } | string> {
  if (!API_KEY) {
    return 'Weather API key is not configured.'
  }

  const response = await getJson(
    `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${encodeURIComponent(place)}`
  )
  if (!response.success) return MESSAGES.API_ERROR

  const json = response.data
  if (!json || !json.request) return `No city found matching \`${place}\``

  const embed = new EmbedBuilder()
    .setTitle('Weather')
    .setColor(EMBED_COLORS.BOT_EMBED)

  if (json.current?.weather_icons?.[0]) {
    embed.setThumbnail(json.current.weather_icons[0])
  }

  embed.addFields(
    {
      name: 'City',
      value: json.location?.name || 'NA',
      inline: true,
    },
    {
      name: 'Region',
      value: json.location?.region || 'NA',
      inline: true,
    },
    {
      name: 'Country',
      value: json.location?.country || 'NA',
      inline: true,
    },
    {
      name: 'Weather condition',
      value: json.current?.weather_descriptions?.[0] || 'NA',
      inline: true,
    },
    {
      name: 'Date',
      value: json.location?.localtime
        ? json.location.localtime.slice(0, 10)
        : 'NA',
      inline: true,
    },
    {
      name: 'Time',
      value: json.location?.localtime
        ? json.location.localtime.slice(11, 16)
        : 'NA',
      inline: true,
    },
    {
      name: 'Temperature',
      value: json.current?.temperature ? `${json.current.temperature}°C` : 'NA',
      inline: true,
    },
    {
      name: 'CloudCover',
      value: json.current?.cloudcover ? `${json.current.cloudcover}%` : 'NA',
      inline: true,
    },
    {
      name: 'Wind Speed',
      value: json.current?.wind_speed
        ? `${json.current.wind_speed} km/h`
        : 'NA',
      inline: true,
    },
    {
      name: 'Wind Direction',
      value: json.current?.wind_dir || 'NA',
      inline: true,
    },
    {
      name: 'Pressure',
      value: json.current?.pressure ? `${json.current.pressure} mb` : 'NA',
      inline: true,
    },
    {
      name: 'Precipitation',
      value: json.current?.precip
        ? `${json.current.precip.toString()} mm`
        : '0 mm',
      inline: true,
    },
    {
      name: 'Humidity',
      value: json.current?.humidity ? json.current.humidity.toString() : 'NA',
      inline: true,
    },
    {
      name: 'Visual Distance',
      value: json.current?.visibility ? `${json.current.visibility} km` : 'NA',
      inline: true,
    },
    {
      name: 'UV Index',
      value: json.current?.uv_index ? json.current.uv_index.toString() : 'NA',
      inline: true,
    }
  )

  if (json.current?.observation_time) {
    embed.setFooter({
      text: `Last checked at ${json.current.observation_time} GMT`,
    })
  }

  return { embeds: [embed] }
}

export default command
