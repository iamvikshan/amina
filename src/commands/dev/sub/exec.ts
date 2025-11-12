import { EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import util from 'util'
import { exec } from 'child_process'
import type { ChatInputCommandInteraction } from 'discord.js'

const execPromise = util.promisify(exec)

export default async function execCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const script = interaction.options.getString('script', true)

  await interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setTitle('Spawning Shell...')
        .setDescription(`Executing command...`)
        .setAuthor({
          name: interaction.client.user.displayName,
          iconURL: interaction.client.user.displayAvatarURL(),
        }),
    ],
  })

  const result = await execute(script)
  await interaction.followUp({ embeds: [result] })
}

async function execute(script: string) {
  try {
    const { stdout } = await execPromise(script)
    const outputEmbed = new EmbedBuilder()
      .setTitle('📥 Output')
      .setDescription(
        `\`\`\`bash\n${stdout.length > 4096 ? `${stdout.substring(0, 4000)}...` : stdout}\n\`\`\``
      )
      .setColor(EMBED_COLORS.BOT_EMBED)
    return outputEmbed
  } catch (error: any) {
    const errorEmbed = new EmbedBuilder()
      .setTitle('📤 Error')
      .setDescription(
        `\`\`\`bash\n${error.message.length > 4096 ? `${error.message.substring(0, 4000)}...` : error.message}\n\`\`\``
      )
      .setColor(EMBED_COLORS.ERROR)
    return errorEmbed
  }
}
