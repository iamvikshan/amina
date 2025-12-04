import { ChatInputCommandInteraction, ButtonStyle } from 'discord.js'
import HttpUtils from '@helpers/HttpUtils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'
import { Logger } from '@helpers/Logger'

interface MemeApiResponse {
  title: string
  url: string
  postLink: string
  subreddit: string
  ups: number
}

const command: CommandData = {
  name: 'meme',
  description: 'fetch a random meme from reddit',
  category: 'FUN',
  cooldown: 1,
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const buttonRow = MinaRows.from(
      MinaButtons.custom(
        'regenMemeBtn',
        mina.say('fun.meme.button.regenerate'),
        ButtonStyle.Secondary
      )
    )

    const embed = await getRandomEmbed('dank')
    await interaction.followUp({
      embeds: [embed],
      components: [buttonRow],
    })

    const collector = interaction.channel?.createMessageComponentCollector({
      filter: reactor => reactor.user.id === interaction.user.id,
    })

    collector?.on('collect', async response => {
      if (response.customId !== 'regenMemeBtn') return
      await response.deferUpdate()

      const embed = await getRandomEmbed('dank')
      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow],
      })
    })
  },
}

async function getRandomEmbed(category: string) {
  try {
    // Call the Meme API, category is always 'dank'
    const response = await HttpUtils.getJson(
      `https://meme-api.com/gimme/${category}`,
      undefined
    )

    if (!response.success) {
      return MinaEmbed.error(mina.say('fun.meme.error.fetchFailed'))
    }

    const meme = response.data as MemeApiResponse

    return MinaEmbed.plain()
      .setColor(mina.color.secondary)
      .setAuthor({
        name: mina.say('fun.meme.reactions'),
        url: meme.postLink,
      })
      .setTitle(meme.title)
      .setImage(meme.url)
      .setFooter({
        text: mina.sayf('fun.meme.footer.upvotes', {
          upvotes: meme.ups.toLocaleString(),
          subreddit: meme.subreddit,
        }),
      })
  } catch (error) {
    Logger.error('Failed to fetch meme', error)
    return MinaEmbed.error(mina.say('fun.meme.error.apiError'))
  }
}

export default command
