import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY } from '@src/config'
import { getRandomInt } from '@helpers/Utils'
import { mina } from '@helpers/mina'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import responses from '@data/responses'

const command: CommandData = {
  name: 'gamble',
  description: 'risk your coins on a slot machine spin',
  category: 'ECONOMY',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: ECONOMY.ENABLED,
    options: [
      {
        name: 'coins',
        description: 'number of coins to bet',
        required: true,
        type: ApplicationCommandOptionType.Integer,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const betAmount = interaction.options.getInteger('coins')
    const response = await gamble(interaction.user, betAmount)
    await interaction.followUp(response)
  },
}

function getEmoji(): string {
  const emojis = responses.lists.slotEmojis
  return emojis[getRandomInt(emojis.length - 1)]
}

function calculateReward(
  amount: number,
  var1: string,
  var2: string,
  var3: string
): number {
  if (var1 === var2 && var2 === var3) return 3 * amount
  if (var1 === var2 || var2 === var3 || var1 === var3) return 2 * amount
  return 0
}

async function gamble(user: User, betAmount: number | null) {
  if (betAmount === null || isNaN(betAmount))
    return mina.say('economy.error.invalidAmount')
  if (betAmount < 0) return mina.say('economy.error.invalidAmount')
  if (betAmount < 10) return mina.sayf('economy.error.minBet', { amount: '10' })

  const userDb = await getUser(user)
  if (userDb.coins < betAmount)
    return mina.sayf('economy.error.insufficientWallet', {
      amount: `${userDb.coins || 0}${ECONOMY.CURRENCY}`,
    })

  const slot1 = getEmoji()
  const slot2 = getEmoji()
  const slot3 = getEmoji()

  const str = `
**gamble amount:** ${betAmount}${ECONOMY.CURRENCY}
**multiplier:** 2x
╔══════════╗
║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ‎‎‎‎║
╠══════════╣
║ ${slot1} ║ ${slot2} ║ ${slot3} ⟸
╠══════════╣
║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ║
╚══════════╝
`

  const reward = calculateReward(betAmount, slot1, slot2, slot3)
  const balance = reward - betAmount
  userDb.coins += balance
  await userDb.save()

  let embed: MinaEmbed
  let resultText: string

  if (reward === betAmount * 3) {
    // Jackpot - triple match
    embed = MinaEmbed.gold()
    resultText = mina.sayf('economy.gamble.jackpot', {
      amount: `${reward}${ECONOMY.CURRENCY}`,
    })
  } else if (reward > 0) {
    // Win - double match
    embed = MinaEmbed.success()
    resultText = mina.sayf('economy.gamble.win', {
      amount: `${reward}${ECONOMY.CURRENCY}`,
    })
  } else {
    // Loss
    embed = MinaEmbed.error()
    resultText = mina.sayf('economy.gamble.lose', {
      amount: `${betAmount}${ECONOMY.CURRENCY}`,
    })
  }

  embed
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setThumbnail(
      'https://i.pinimg.com/originals/9a/f1/4e/9af14e0ae92487516894faa9ea2c35dd.gif'
    )
    .setDescription(str)
    .setFooter({
      text: `${resultText}\n${mina.sayf('economy.updatedBalance', { amount: `${userDb.coins}${ECONOMY.CURRENCY}` })}`,
    })

  return { embeds: [embed] }
}

export default command
