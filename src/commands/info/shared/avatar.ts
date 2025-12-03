import { User } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default function avatar(user: User) {
  const x64 = user.displayAvatarURL({ extension: 'png', size: 64 })
  const x128 = user.displayAvatarURL({ extension: 'png', size: 128 })
  const x256 = user.displayAvatarURL({ extension: 'png', size: 256 })
  const x512 = user.displayAvatarURL({ extension: 'png', size: 512 })
  const x1024 = user.displayAvatarURL({ extension: 'png', size: 1024 })
  const x2048 = user.displayAvatarURL({ extension: 'png', size: 2048 })

  const links = `[x64](${x64}) | [x128](${x128}) | [x256](${x256}) | [x512](${x512}) | [x1024](${x1024}) | [x2048](${x2048})`

  const embed = MinaEmbed.info()
    .setAuthor({
      name: mina.sayf('infoCmd.avatar.title', { user: user.username }),
    })
    .setImage(x256)
    .setDescription(links)

  return {
    embeds: [embed],
  }
}
