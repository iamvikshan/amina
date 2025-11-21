import { EmbedBuilder } from 'discord.js'
import { BotClient } from '@structures/BotClient'
import type { ChatInputCommandInteraction } from 'discord.js'
import { config } from '@src/config'

export default async function reload(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const client = interaction.client as BotClient
  const type = interaction.options.getString('type', true)

  // Helper to register commands to test guild
  const registerCommands = async () => {
    const testGuild = client.guilds.cache.get(
      config.BOT.TEST_GUILD_ID as string
    )
    if (testGuild) {
      const devConfig = await import('@schemas/Dev').then(m =>
        m.getDevCommandsConfig()
      )

      const commandsToSet = client.slashCommands
        .filter(
          cmd =>
            cmd.testGuildOnly ||
            (cmd.devOnly && devConfig.ENABLED) ||
            (client.config.INTERACTIONS.GLOBAL &&
              !cmd.testGuildOnly &&
              !cmd.devOnly)
        )
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: 1, // ApplicationCommandType.ChatInput
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false,
        }))

      await testGuild.commands.set(commandsToSet)
    }
  }

  try {
    switch (type.toLowerCase()) {
      case 'commands':
        client.loadCommands('src/commands')
        await registerCommands()
        break
      case 'events':
        client.loadEvents('src/events')
        break
      case 'contexts':
        client.loadContexts('src/contexts')
        await registerCommands()
        break
      case 'all':
        client.loadCommands('src/commands')
        client.loadContexts('src/contexts')
        client.loadEvents('src/events')
        await registerCommands()
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
