import { User } from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY } from '@src/config'
import { mina } from '@helpers/mina'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function deposit(
  user: User,
  coins: number
): Promise<string | { embeds: MinaEmbed[] }> {
  if (isNaN(coins) || coins <= 0) return mina.say('economy.error.invalidAmount')
  const userDb = await getUser(user)

  if (coins > userDb.coins)
    return mina.sayf('economy.error.insufficientWallet', {
      amount: `${userDb.coins}${ECONOMY.CURRENCY}`,
    })

  userDb.coins -= coins
  userDb.bank += coins
  await userDb.save()

  const embed = MinaEmbed.success()
    .setAuthor({ name: mina.say('economy.balance.newBalance') })
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: 'wallet',
        value: `${userDb.coins}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'bank',
        value: `${userDb.bank}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: 'net worth',
        value: `${userDb.coins + userDb.bank}${ECONOMY.CURRENCY}`,
        inline: true,
      }
    )

  return { embeds: [embed] }
}
