import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { MESSAGES, secret } from '@src/config'
import { getJson } from '@helpers/HttpUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'weather',
  description: 'get weather information',
  cooldown: 5,
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],

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
): Promise<{ embeds: MinaEmbed[] } | string> {
  if (!secret.WEATHERSTACK_KEY) {
    return 'Weather API key is not configured.'
  }

  const response = await getJson(
    `http://api.weatherstack.com/current?access_key=${secret.WEATHERSTACK_KEY}&query=${encodeURIComponent(place)}`
  )
  if (!response.success) return MESSAGES.API_ERROR

  const json = response.data
  if (!json || !json.request) return `No city found matching \`${place}\``

  const embed = MinaEmbed.primary().setTitle('weather')

  if (json.current?.weather_icons?.[0]) {
    embed.setThumbnail(json.current.weather_icons[0])
  }

  embed.addFields(
    {
      name: 'city',
      value: json.location?.name || 'NA',
      inline: true,
    },
    {
      name: 'region',
      value: json.location?.region || 'NA',
      inline: true,
    },
    {
      name: 'country',
      value: json.location?.country || 'NA',
      inline: true,
    },
    {
      name: 'weather condition',
      value: json.current?.weather_descriptions?.[0] || 'NA',
      inline: true,
    },
    {
      name: 'date',
      value: json.location?.localtime
        ? json.location.localtime.slice(0, 10)
        : 'NA',
      inline: true,
    },
    {
      name: 'time',
      value: json.location?.localtime
        ? json.location.localtime.slice(11, 16)
        : 'NA',
      inline: true,
    },
    {
      name: 'temperature',
      value: json.current?.temperature ? `${json.current.temperature}°C` : 'NA',
      inline: true,
    },
    {
      name: 'cloud cover',
      value: json.current?.cloudcover ? `${json.current.cloudcover}%` : 'NA',
      inline: true,
    },
    {
      name: 'wind speed',
      value: json.current?.wind_speed
        ? `${json.current.wind_speed} km/h`
        : 'NA',
      inline: true,
    },
    {
      name: 'wind direction',
      value: json.current?.wind_dir || 'NA',
      inline: true,
    },
    {
      name: 'pressure',
      value: json.current?.pressure ? `${json.current.pressure} mb` : 'NA',
      inline: true,
    },
    {
      name: 'precipitation',
      value: json.current?.precip
        ? `${json.current.precip.toString()} mm`
        : '0 mm',
      inline: true,
    },
    {
      name: 'humidity',
      value: json.current?.humidity ? json.current.humidity.toString() : 'NA',
      inline: true,
    },
    {
      name: 'visual distance',
      value: json.current?.visibility ? `${json.current.visibility} km` : 'NA',
      inline: true,
    },
    {
      name: 'uv index',
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
