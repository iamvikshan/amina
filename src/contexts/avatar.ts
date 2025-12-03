import { ApplicationCommandType, type User } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
// ContextData is now globally available - see types/contexts.d.ts

const avatarContext: ContextData = {
  name: 'avatar',
  description: 'displays avatar information about the user',
  type: ApplicationCommandType.User,
  enabled: true,
  ephemeral: true,

  async run(interaction) {
    const user = await interaction.client.users.fetch(interaction.targetId)
    const response = getAvatar(user)
    await interaction.followUp(response)
  },
}

function getAvatar(user: User) {
  const x64 = user.displayAvatarURL({ extension: 'png', size: 64 })
  const x128 = user.displayAvatarURL({ extension: 'png', size: 128 })
  const x256 = user.displayAvatarURL({ extension: 'png', size: 256 })
  const x512 = user.displayAvatarURL({ extension: 'png', size: 512 })
  const x1024 = user.displayAvatarURL({ extension: 'png', size: 1024 })
  const x2048 = user.displayAvatarURL({ extension: 'png', size: 2048 })

  const embed = MinaEmbed.primary()
    .setTitle(`avatar of ${user.username}`)
    .setImage(x256)
    .setDescription(
      `links: • [x64](${x64}) ` +
        `• [x128](${x128}) ` +
        `• [x256](${x256}) ` +
        `• [x512](${x512}) ` +
        `• [x1024](${x1024}) ` +
        `• [x2048](${x2048}) `
    )

  return {
    embeds: [embed],
  }
}

export default avatarContext
