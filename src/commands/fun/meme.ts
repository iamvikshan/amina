import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js'
import config from '@src/config'
import HttpUtils from '@helpers/HttpUtils'
import Utils from '@helpers/Utils'
import type { CommandData } from '@structures/Command'

interface MemeApiResponse {
  title: string
  url: string
  postLink: string
  subreddit: string
  ups: number
}

const command: CommandData = {
  name: 'meme',
  description: '✨ Time for some giggles! Let me find you a funny meme! 🎭',
  category: 'FUN',
  cooldown: 1,
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('regenMemeBtn')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎲')
        .setLabel('Another one!')
    )

    const embed = await getRandomEmbed('dank')
    await interaction.editReply({
      embeds: [embed],
      components: [buttonRow],
    })

    const collector = interaction.channel?.createMessageComponentCollector({
      filter: reactor => reactor.user.id === interaction.user.id,
      time: 5 * 60 * 1000, // 5 minutes
    })

    collector?.on('collect', async response => {
      try {
        if (response.customId !== 'regenMemeBtn') return

        // Defer the update first
        if (!response.deferred && !response.replied) {
          await response.deferUpdate()
        }

        const embed = await getRandomEmbed('dank')
        await interaction.editReply({
          embeds: [embed],
          components: [buttonRow],
        })
      } catch (error) {
        // Log the error but don't crash
        console.error('Error handling meme button interaction:', error)
      }
    })

    collector?.on('end', () => {
      // Disable the button after timeout
      buttonRow.components[0].setDisabled(true)
      interaction
        .editReply({ embeds: [embed], components: [buttonRow] })
        .catch(() => {})
    })
  },
}

async function getRandomEmbed(category: string): Promise<EmbedBuilder> {
  try {
    // Call the Meme API, category is always 'dank'
    const response = await HttpUtils.getJson(
      `https://meme-api.com/gimme/${category}`,
      undefined
    )

    if (!response.success) {
      return new EmbedBuilder()
        .setColor(config.EMBED_COLORS.ERROR)
        .setDescription(
          "*pouts* Aww, the memes are being shy! Let's try again! 🎨"
        )
    }

    const meme = response.data as MemeApiResponse

    // Amina's random meme reactions
    const reactions = [
      "(*≧▽≦) This one's gold!",
      '✨ Look what I found! ✨',
      'This made me giggle~ 🎭',
      'Quality meme incoming! 🌟',
    ]

    return new EmbedBuilder()
      .setAuthor({
        name: reactions[Utils.getRandomInt(reactions.length)],
        url: meme.postLink,
      })
      .setTitle(meme.title)
      .setImage(meme.url)
      .setColor('Random')
      .setFooter({
        text: `💖 ${meme.ups.toLocaleString()} upvotes | From r/${meme.subreddit}`,
      })
  } catch (_error) {
    return new EmbedBuilder()
      .setColor(config.EMBED_COLORS.ERROR)
      .setDescription(
        "*dramatic gasp* The memes escaped! Don't worry, we can catch them next time! 🎨✨"
      )
  }
}

export default command
