import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { config } from '@src/config'
import { setDevCommands } from '@schemas/Dev'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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
        // Only register devOnly and testGuildOnly commands to test guild
        // Regular commands come from global registration
        const commandsToSet = (client as BotClient).slashCommands
          .filter(cmd => cmd.testGuildOnly || (cmd.devOnly && enabled))
          .map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            type: ApplicationCommandType.ChatInput,
            options: cmd.slashCommand?.options || [],
            dm_permission: cmd.dmCommand ?? false,
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
            MinaEmbed.error().setDescription(
              'failed to update test guild commands. check bot logs for details.'
            ),
          ],
        })
      }
    }

    const embed = MinaEmbed.success().setDescription(
      `dev commands are now ${enabled ? 'enabled' : 'disabled'}!\n` +
        `current state: \`${enabled ? 'ENABLED' : 'DISABLED'}\``
    )

    return interaction.followUp({ embeds: [embed] })
  },
}

export default command
