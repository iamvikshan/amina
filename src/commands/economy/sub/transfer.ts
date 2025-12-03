import { User } from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY } from '@src/config'
import { mina } from '@helpers/mina'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export default async function transfer(
  self: User,
  target: User,
  coins: number
): Promise<string | { embeds: MinaEmbed[] }> {
  if (isNaN(coins) || coins <= 0) return mina.say('economy.error.invalidAmount')
  if (target.bot) return mina.say('economy.transfer.noBots')
  if (target.id === self.id) return mina.say('economy.transfer.noSelf')

  const userDb = await getUser(self)

  if (userDb.bank < coins) {
    const hint =
      userDb.coins > 0 ? '\n' + mina.say('economy.error.depositHint') : ''
    return (
      mina.sayf('economy.error.insufficientBank', {
        amount: `${userDb.bank}${ECONOMY.CURRENCY}`,
      }) + hint
    )
  }

  const targetDb = await getUser(target)

  userDb.bank -= coins
  targetDb.bank += coins

  await userDb.save()
  await targetDb.save()

  const embed = MinaEmbed.success()
    .setAuthor({ name: mina.say('economy.transfer.complete') })
    .setDescription(
      mina.sayf('economy.transfer.success', {
        amount: `${coins}${ECONOMY.CURRENCY}`,
        target: target.username,
      })
    )
    .setTimestamp(Date.now())

  return { embeds: [embed] }
}
