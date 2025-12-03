import { User } from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function balance(user: User) {
  const economy = await getUser(user)

  const embed = MinaEmbed.info()
    .setAuthor({ name: user.username })
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: 'wallet',
        value: `${economy?.coins || 0}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'bank',
        value: `${economy?.bank || 0}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'net worth',
        value: `${(economy?.coins || 0) + (economy?.bank || 0)}${ECONOMY.CURRENCY}`,
        inline: true,
      }
    )

  return { embeds: [embed] }
}
