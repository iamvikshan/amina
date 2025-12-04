import { ChatInputCommandInteraction, User } from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY } from '@src/config'
import { diffHours, getRemainingTime } from '@helpers/Utils'
import { mina } from '@helpers/mina'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'daily',
  description: 'claim your daily coin reward with streak bonuses',
  category: 'ECONOMY',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: ECONOMY.ENABLED,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await daily(interaction.user)
    await interaction.followUp(response)
  },
}

async function daily(user: User) {
  const userDb = await getUser(user)
  let streak = 0

  if (userDb.daily.timestamp) {
    const lastUpdated = new Date(userDb.daily.timestamp)
    const difference = diffHours(new Date(), lastUpdated)
    if (difference < 24) {
      const nextUsage = new Date(
        lastUpdated.setHours(lastUpdated.getHours() + 24)
      )
      return mina.sayf('economy.cooldown.daily', {
        time: getRemainingTime(nextUsage),
      })
    }
    streak = userDb.daily.streak || streak
    if (difference < 48) streak += 1
    else streak = 0
  }

  userDb.daily.streak = streak
  userDb.coins += ECONOMY.DAILY_COINS
  userDb.daily.timestamp = new Date()
  await userDb.save()

  const embed = MinaEmbed.success()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(
      `${mina.sayf('economy.daily', { amount: `${ECONOMY.DAILY_COINS}${ECONOMY.CURRENCY}` })}\n` +
        `${mina.sayf('economy.updatedBalance', { amount: `${userDb.coins}${ECONOMY.CURRENCY}` })}` +
        (streak > 0
          ? `\n${mina.sayf('economy.streak', { count: streak.toString() })}`
          : '')
    )

  return { embeds: [embed] }
}

export default command
