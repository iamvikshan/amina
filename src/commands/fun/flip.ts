import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  User,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import responses from '@data/responses'
const NORMAL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_,;.?!/\\'0123456789"
const FLIPPED =
  "∀qϽᗡƎℲƃHIſʞ˥WNOԀὉᴚS⊥∩ΛMXʎZɐqɔpǝɟbɥıظʞןɯuodbɹsʇnʌʍxʎz‾'؛˙¿¡/\\,0ƖᄅƐㄣϛ9ㄥ86"

const command: CommandData = {
  name: 'flip',
  description: "Want to flip a coin or text? Let's play a fun game!",
  category: 'FUN',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'coin',
        description: "Ready to test your luck? Let's flip a coin!",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'text',
        description: "Let's turn your words upside down!",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'input',
            description: 'What message should I flip for you?',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand() // FIX: Removed 'type' parameter

    if (sub === 'coin') {
      const items = ['HEAD', 'TAIL']
      const toss = items[Math.floor(Math.random() * items.length)]
      await interaction.followUp({ embeds: [firstEmbed(interaction.user)] })

      setTimeout(() => {
        interaction.editReply({ embeds: [secondEmbed()] }).catch(() => {})
        setTimeout(() => {
          interaction.editReply({ embeds: [resultEmbed(toss)] }).catch(() => {})
        }, 2000)
      }, 2000)
    } else if (sub === 'text') {
      const input = interaction.options.getString('input')
      if (!input) {
        return interaction.followUp(mina.say('fun.flip.text.noInput'))
      }
      const response = await flipText(input)
      await interaction.followUp({
        content: mina.sayf('fun.flip.text.success', { text: response }),
      })
    }
    return
  },
}

const firstEmbed = (user: User): MinaEmbed => {
  const coinTossIntros = responses.fun.flip.intros
  const randomIntro =
    coinTossIntros[Math.floor(Math.random() * coinTossIntros.length)]
  return MinaEmbed.primary()
    .setTitle(randomIntro)
    .setDescription(
      mina.sayf('fun.flip.embed.description', { user: user.username })
    )
    .setImage(
      'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZW4ydjNmdWprcmJmbXEyZnhrN3piZHRscGNtaXVhaGlpMTFyeGwxMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZR8teuiCs3AkSkzjnG/giphy.gif'
    )
}

const secondEmbed = (): MinaEmbed => {
  const waitingMessages = responses.fun.flip.waiting
  const randomWait =
    waitingMessages[Math.floor(Math.random() * waitingMessages.length)]
  return MinaEmbed.loading()
    .setDescription(randomWait)
    .setImage(
      'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZW4ydjNmdWprcmJmbXEyZnhrN3piZHRscGNtaXVhaGlpMTFyeGwxMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZR8teuiCs3AkSkzjnG/giphy.gif'
    )
}

const resultEmbed = (toss: string): MinaEmbed => {
  const winMessages = responses.fun.flip.win as Record<string, string>

  return MinaEmbed.success()
    .setTitle(winMessages[toss] || mina.say('fun.flip.embed.resultTitle'))
    .setDescription(mina.sayf('fun.flip.embed.resultDescription', { toss }))
    .setImage(
      toss === 'HEAD'
        ? 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTh5ZXg3d3h1dWVnY2RsdXRjamp1ZnYwZHdmejQxcXFvZ213NXBvMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9uorwgUW3jFsY/giphy.gif'
        : 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXhpaXljMnFhcnRtOGVjZXM0OG9xZG10bWdudGl2OWk0MDdwdXFlZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9dg/ixeyDqK6aao6WSdvpL/giphy.gif'
    )
}

async function flipText(text: string): Promise<string> {
  let builder = ''
  for (let i = 0; i < text.length; i += 1) {
    const letter = text.charAt(i)
    const a = NORMAL.indexOf(letter)
    builder += a !== -1 ? FLIPPED.charAt(a) : letter
  }
  return builder
}

export default command
