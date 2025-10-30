import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandData } from '@structures/Command'

/**
 * Example TypeScript command - demonstrates gradual migration
 * This is a simple ping command converted to TypeScript
 */
const command: CommandData = {
  name: 'tsping',
  description: '🎯 TypeScript example - Check bot and API latency',
  category: 'UTILITY',
  cooldown: 5,
  botPermissions: ['SendMessages'],
  slashCommand: {
    enabled: true,
    ephemeral: false,
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const start = Date.now()

    // Send initial response
    await interaction.followUp({
      content: '🏓 Pinging...',
    })

    // Calculate latencies
    const latency = Date.now() - start
    const apiLatency = interaction.client.ws.ping

    // Update with results
    await interaction.editReply({
      content:
        `🏓 **Pong!**\n\n` +
        `📡 **API Latency:** \`${apiLatency}ms\`\n` +
        `⚡ **Bot Latency:** \`${latency}ms\`\n\n` +
        `✨ *This command is written in TypeScript!*`,
    })
  },
}

export default command

