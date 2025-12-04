import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import responses from '@data/responses'

// Amina's creative love responses

const command: CommandData = {
  name: 'love',
  description:
    'calculate a totally scientific love percentage between two users',
  category: 'FUN',
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'user1',
        description: 'first user in the love calculation',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'user2',
        description: 'second user in the love calculation',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const user1 = interaction.options.getUser('user1')
    const user2 = interaction.options.getUser('user2')
    if (!user1 || !user2) {
      return interaction.followUp('Please provide two users!')
    }
    const response = await getUserLove(user1, user2, interaction.user)
    await interaction.followUp(response)
    return
  },
}

async function getUserLove(
  user1: User,
  user2: User,
  mauthor: User
): Promise<{ embeds: MinaEmbed[] }> {
  const result = Math.ceil(Math.random() * 100)

  // Get a random response based on the result
  let loveStatus: string
  let customResponse: string
  const loveData = responses.fun.love

  if (result <= 20) {
    loveStatus = loveData.titles.low
    customResponse =
      loveData.low[Math.floor(Math.random() * loveData.low.length)]
  } else if (result <= 50) {
    loveStatus = loveData.titles.decent
    customResponse =
      loveData.decent[Math.floor(Math.random() * loveData.decent.length)]
  } else if (result <= 80) {
    loveStatus = loveData.titles.good
    customResponse =
      loveData.good[Math.floor(Math.random() * loveData.good.length)]
  } else {
    loveStatus = loveData.titles.perfect
    customResponse =
      loveData.perfect[Math.floor(Math.random() * loveData.perfect.length)]
  }

  const loveImage =
    result >= 51
      ? 'https://media1.giphy.com/media/TmngSmlDjzJfO/giphy.gif?cid=ecf05e47brm0fzk1kan0ni753jmvvik6h27sp13fkn8a9kih&rid=giphy.gif&ct=g'
      : 'https://media4.giphy.com/media/SIPIe590rx6iA/giphy.gif?cid=ecf05e476u1ciogyg7rjw1aaoh29s912axi5r7b5r46fczx6&rid=giphy.gif&ct=g'

  const embed = MinaEmbed.primary()
    .setTitle(mina.say('fun.love.embed.title'))
    .setDescription(mina.say('fun.love.embed.description'))
    .addFields(
      {
        name: mina.say('fun.love.embed.resultTitle'),
        value: mina.sayf('fun.love.embed.resultValue', {
          user1: user1.username,
          user2: user2.username,
          percent: result.toString(),
          response: customResponse,
        }),
        inline: false,
      },
      {
        name: mina.say('fun.love.embed.statusTitle'),
        value: loveStatus,
        inline: false,
      }
    )
    .setImage(loveImage)
    .setThumbnail('https://www.wownow.net.in/assets/images/love.gif')
    .setFooter({
      text: mina.sayf('fun.love.embed.footer', { user: mauthor.tag }),
    })
    .setTimestamp()

  return { embeds: [embed] }
}

export default command
