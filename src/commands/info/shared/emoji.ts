import { parseEmoji } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default function emojiInfo(emoji: string) {
  const custom = parseEmoji(emoji)
  if (!custom || !custom.id) return mina.say('infoCmd.emoji.error.invalid')

  const url = `https://cdn.discordapp.com/emojis/${custom.id}.${custom.animated ? 'gif?v=1' : 'png'}`

  const embed = MinaEmbed.info()
    .setAuthor({ name: mina.say('infoCmd.emoji.title') })
    .setDescription(
      `> id: **${custom.id}**\n` +
        `> name: **${custom.name}**\n` +
        `> animated: **${custom.animated ? 'yes' : 'no'}**`
    )
    .setImage(url)

  return { embeds: [embed] }
}
