import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from 'discord.js'
import { EMBED_COLORS, config } from '@src/config'
import { setDevCommands } from '@schemas/Dev'

import type { BotClient } from '@structures/BotClient'

const command: CommandData = {
  name: 'zzz',
  description: 'Toggle dev commands on/off',
  category: 'DEV',
  botPermissions: ['EmbedLinks'],
  testGuildOnly: true,
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'enabled',
        description: 'Enable or disable dev commands',
        type: ApplicationCommandOptionType.Boolean,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const { client } = interaction

    const enabled = interaction.options.getBoolean('enabled', true)

    // Update database state
    await setDevCommands(enabled)

    // Register/Unregister commands in test guild
    const testGuild = client.guilds.cache.get(
      config.BOT.TEST_GUILD_ID as string
    )
    if (testGuild) {
      try {
        const commandsToSet = (client as BotClient).slashCommands
          .filter(
            cmd =>
              cmd.testGuildOnly ||
              (cmd.devOnly && enabled) ||
              // Also include regular commands if GLOBAL=true, so we don't wipe them from test guild
              ((client as BotClient).config.INTERACTIONS.GLOBAL &&
                !cmd.testGuildOnly &&
                !cmd.devOnly)
          )
          .map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            type: ApplicationCommandType.ChatInput,
            options: cmd.slashCommand?.options || [],
          }))

        await testGuild.commands.set(commandsToSet)
        ;(client as BotClient).logger.success(
          `Updated test guild commands. ${
            enabled ? 'Enabled' : 'Disabled'
          } dev commands.`
        )
      } catch (error: any) {
        ;(client as BotClient).logger.error(
          `Failed to update test guild commands: ${error.message}`
        )
        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.ERROR)
              .setDescription(
                'Failed to update test guild commands. Check bot logs for details.'
              ),
          ],
        })
      }
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        `✅ Dev commands are now ${enabled ? 'enabled' : 'disabled'}!\n` +
          `Current state: \`${enabled ? 'ENABLED' : 'DISABLED'}\``
      )

    return interaction.followUp({ embeds: [embed] })
  },
}

export default command
