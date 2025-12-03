import { ChatInputCommandInteraction, User } from 'discord.js'
import { getUser } from '@schemas/User'
import { ECONOMY } from '@src/config'
import { mina } from '@helpers/mina'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import responses from '@data/responses'

const command: CommandData = {
  name: 'beg',
  description: 'beg from someone',
  category: 'ECONOMY',
  cooldown: 3600,
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: ECONOMY.ENABLED,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const response = await beg(interaction.user)
    await interaction.followUp(response)
  },
}

async function beg(user: User) {
  const celebrities = responses.lists.celebrities
  const celebrity = celebrities[Math.floor(Math.random() * celebrities.length)]

  const amount = Math.floor(
    Math.random() * (ECONOMY.MAX_BEG_AMOUNT - ECONOMY.MIN_BEG_AMOUNT + 1) +
      ECONOMY.MIN_BEG_AMOUNT
  )
  const userDb = await getUser(user)
  userDb.coins += amount
  await userDb.save()

  const embed = MinaEmbed.success()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(
      `${mina.sayf('economy.beg.success', { celebrity, amount: `${amount}${ECONOMY.CURRENCY}` })}\n` +
        `${mina.sayf('economy.updatedBalance', { amount: `${userDb.coins}${ECONOMY.CURRENCY}` })}`
    )

  return { embeds: [embed] }
}

export default command
