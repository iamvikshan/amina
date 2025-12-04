import { ChatInputCommandInteraction } from 'discord.js'
import { musicValidations } from '@helpers/BotUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'leave',
  description: 'disconnect me from the voice channel',
  category: 'MUSIC',
  validations: musicValidations,
  slashCommand: {
    enabled: true,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
    }
    const response = await leave({
      client: interaction.client,
      guildId: interaction.guildId,
    })
    return interaction.followUp(response)
  },
}

async function leave({
  client,
  guildId,
}: {
  client: any
  guildId: string
}): Promise<string | { embeds: MinaEmbed[] }> {
  const player = client.musicManager.getPlayer(guildId)

  if (!player) {
    return { embeds: [MinaEmbed.error(mina.say('error.notInVoice'))] }
  }

  player.destroy()
  return { embeds: [MinaEmbed.success(mina.say('music.success.left'))] }
}

export default command
