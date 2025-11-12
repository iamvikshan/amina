import { EmbedBuilder } from 'discord.js'
import { BotClient } from '@structures/BotClient'
import type { ChatInputCommandInteraction } from 'discord.js'

export default async function reload(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const client = interaction.client as BotClient
  const type = interaction.options.getString('type', true)

  try {
    switch (type.toLowerCase()) {
      case 'commands':
        client.loadCommands('src/commands')
        break
      case 'events':
        client.loadEvents('src/events')
        break
      case 'contexts':
        client.loadContexts('src/contexts')
        break
      case 'all':
        client.loadCommands('src/commands')
        client.loadContexts('src/contexts')
        client.loadEvents('src/events')
        break
      default:
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle('Error')
              .setDescription('Command type not selected')
              .setColor('Red'),
          ],
        })
        return
    }
  } catch (e) {
    console.error(e)
  }

  await interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setTitle('Reloaded')
        .setDescription(`Reloaded ${type}`)
        .setColor('Green'),
    ],
  })
}
