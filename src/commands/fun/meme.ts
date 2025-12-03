import { ChatInputCommandInteraction, ButtonStyle } from 'discord.js'
import HttpUtils from '@helpers/HttpUtils'
// CommandData is globally available - see types/commands.d.ts
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

interface MemeApiResponse {
  title: string
  url: string
  postLink: string
  subreddit: string
  ups: number
}

const command: CommandData = {
  name: 'meme',
  description: 'get a random meme',
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

    return MinaEmbed.primary()
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
  } catch (_error) {
    return MinaEmbed.error(mina.say('fun.meme.error.apiError'))
  }
}

export default command
