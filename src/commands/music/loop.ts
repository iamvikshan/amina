import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'loop',
  description: 'loop the current track, entire queue, or disable looping',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'type',
        type: ApplicationCommandOptionType.String,
        description: 'select loop type',
        required: false,
        choices: [
          { name: 'track', value: 'track' },
          { name: 'queue', value: 'queue' },
          { name: 'off', value: 'off' },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
    }
    const type = interaction.options.getString('type') || 'track'
    const response = await toggleLoop(
      { client: interaction.client, guildId: interaction.guildId },
      type
    )
    return await interaction.followUp(response)
  },
}

async function toggleLoop(
  {
    client,
    guildId,
  }: {
    client: any
    guildId: string
  },
  type: string
): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player || !player.queue.current) {
    return { embeds: [MinaEmbed.error(mina.say('error.notPlaying'))] }
  }

  switch (type) {
    case 'track':
      player.setRepeatMode('track')
      return {
        embeds: [
          MinaEmbed.success(
            mina.sayf('music.success.looped', { mode: 'track' })
          ),
        ],
      }

    case 'queue':
      if (player.queue.tracks.length > 1) {
        player.setRepeatMode('queue')
        return {
          embeds: [
            MinaEmbed.success(
              mina.sayf('music.success.looped', { mode: 'queue' })
            ),
          ],
        }
      } else {
        return { embeds: [MinaEmbed.warning('queue is too short to loop.')] }
      }

    case 'off':
      player.setRepeatMode('off')
      return {
        embeds: [
          MinaEmbed.info(mina.sayf('music.success.looped', { mode: 'off' })),
        ],
      }

    default:
      return {
        embeds: [MinaEmbed.error(mina.say('error.invalidLoopType'))],
      }
  }
}

export default command
