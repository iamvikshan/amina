import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'qrcode',
  description: 'Generate a QR code with the url that is provided',
  category: 'UTILITY',
  botPermissions: ['EmbedLinks'],

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'url',
        description: 'URL to generate QR code for',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  async interactionRun(interaction: ChatInputCommandInteraction) {
    const text = interaction.options.getString('url', true)
    const baseURL = 'http://api.qrserver.com/v1'
    const regex =
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/

    if (!text.match(regex)) {
      const guild = interaction.guild as Guild | null
      const embed = MinaEmbed.error()
        .setTitle(mina.say('utility.qrcode.error.invalidUrl'))
        .setDescription(mina.say('utility.qrcode.error.provideValid'))
        .setFooter({ text: guild?.name || 'qr code generator' })
        .setTimestamp()

      return interaction.followUp({ embeds: [embed] })
    }

    const encodedURL =
      `${baseURL}/create-qr-code/?size=150x150&data=` + encodeURIComponent(text)

    const embedqr = MinaEmbed.success()
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle(mina.say('utility.qrcode.title'))
      .setDescription(mina.sayf('utility.qrcode.description', { url: text }))
      .setImage(encodedURL)
      .setThumbnail(
        'https://img.freepik.com/vector-premium/personaje-dibujos-animados-codigo-qr-buscando-lupa-diseno-lindo_152558-13614.jpg?w=826'
      )
      .setFooter({ text: interaction.guild?.name || 'qr code generator' })
      .setTimestamp()

    await interaction.followUp({ embeds: [embedqr] })
    return
  },
}

export default command
