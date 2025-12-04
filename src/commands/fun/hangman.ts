import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { Hangman } from 'discord-gamecord'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

// Themes with Amina's creative touch
const choices = [
  { name: 'nature', emoji: '🌿' },
  { name: 'sport', emoji: '⚽' },
  { name: 'color', emoji: '🎨' },
  { name: 'camp', emoji: '⛺' },
  { name: 'fruit', emoji: '🍎' },
  { name: 'discord', emoji: '💬' },
  { name: 'winter', emoji: '❄️' },
  { name: 'pokemon', emoji: '⭐' },
]

const command: CommandData = {
  name: 'hangman',
  description: 'play a word guessing game with themed word lists',
  category: 'FUN',
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'theme',
        description: 'word category to guess from',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: choices.map(choice => ({
          name: `${choice.emoji} ${choice.name}`,
          value: choice.name,
        })),
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('theme')
    if (!choice) {
      return interaction.followUp(mina.say('error.missingInfo'))
    }

    const Game = new Hangman({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: mina.sayf('fun.hangman.title', {
          theme: choice.charAt(0).toUpperCase() + choice.slice(1),
        }),
        color: mina.palette.discordBlurple,
      },
      hangman: {
        hat: '🎩',
        head: '🤔',
        shirt: '👕',
        pants: '🩳',
        boots: '👞👞',
      },
      timeoutTime: 60000,
      theme: choice,
      winMessage: mina.say('fun.hangman.win'),
      loseMessage: mina.say('fun.hangman.lose'),
      playerOnlyMessage: mina.say('fun.hangman.playerOnly'),
    })

    Game.startGame()
    Game.on('gameOver', (result: any) => {
      if (result.result === 'win') {
        const embed = MinaEmbed.success()
          .setTitle('hangman champion')
          .setDescription(mina.sayf('fun.hangman.win', { word: result.word }))
          .setTimestamp()
        interaction.followUp({ embeds: [embed] })
      } else if (result.result === 'lose') {
        const embed = MinaEmbed.error()
          .setTitle('hangman game over')
          .setDescription(mina.sayf('fun.hangman.lose', { word: result.word }))
          .setTimestamp()
        interaction.followUp({ embeds: [embed] })
      }
    })
    return
  },
}

export default command
