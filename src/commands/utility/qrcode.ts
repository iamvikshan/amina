import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
} from 'discord.js'

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
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(`Invalid URL`)
        .setDescription(`Please provide a valid URL.`)
        .setFooter({ text: guild?.name || 'QR Code Generator' })
        .setTimestamp()

      return interaction.followUp({ embeds: [embed] })
    }

    const encodedURL =
      `${baseURL}/create-qr-code/?size=150x150&data=` + encodeURIComponent(text)

    const embedqr = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor('Green')
      .setTitle(`QR Code`)
      .setDescription(
        `Here is your QR code for the URL:  [click here](${text})`
      )
      .setImage(encodedURL)
      .setThumbnail(
        'https://img.freepik.com/vector-premium/personaje-dibujos-animados-codigo-qr-buscando-lupa-diseno-lindo_152558-13614.jpg?w=826'
      )
      .setFooter({ text: interaction.guild?.name || 'QR Code Generator' })
      .setTimestamp()

    await interaction.followUp({ embeds: [embedqr] })
    return
  },
}

export default command
