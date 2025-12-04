import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { TicTacToe } from 'discord-gamecord'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'tictactoe',
  description: 'challenge someone to a classic game of tic tac toe',
  cooldown: 1,
  category: 'FUN',
  botPermissions: [
    'SendMessages',
    'EmbedLinks',
    'AddReactions',
    'ReadMessageHistory',
    'ManageMessages',
  ],
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [
      {
        name: 'user',
        description: 'the user to challenge',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const opponent = interaction.options.getUser('user')
    if (!opponent) {
      return interaction.followUp(mina.say('errors.missingInfo'))
    }

    // Check if opponent is a bot
    if (opponent.bot) {
      return interaction.followUp({
        content: mina.say('fun.tictactoe.botOpponent'),
        ephemeral: true,
      })
    }

    // Check if user is trying to play with themselves
    if (opponent.id === interaction.user.id) {
      return interaction.followUp({
        content: mina.say('fun.tictactoe.selfOpponent'),
        ephemeral: true,
      })
    }

    const Game = new TicTacToe({
      message: interaction,
      isSlashGame: true,
      opponent: opponent,
      embed: {
        title: 'tic tac toe challenge!',
        color: MinaEmbed.primary().data.color,
        statusTitle: 'current status',
        overTitle: 'game over!',
      },
      emojis: {
        xButton: '❌',
        oButton: '🔵',
        blankButton: '➖',
      },
      mentionUser: true,
      timeoutTime: 60000,
      xButtonStyle: 'DANGER',
      oButtonStyle: 'PRIMARY',
      turnMessage: mina.say('fun.tictactoe.turnMessage'),
      winMessage: mina.say('fun.tictactoe.winMessage'),
      tieMessage: mina.say('fun.tictactoe.tieMessage'),
      timeoutMessage: mina.say('fun.tictactoe.timeoutMessage'),
      playerOnlyMessage: mina.say('fun.tictactoe.playerOnlyMessage'),
    })

    Game.startGame()
    Game.on('gameOver', (result: any) => {
      const winners = result.winner
      const winner = `<@${winners}>`

      if (result.result === 'tie') {
        const embed = MinaEmbed.warning()
          .setTitle('tic tac toe results')
          .setDescription(mina.say('fun.tictactoe.tieResult'))
          .setTimestamp()
        interaction.followUp({ embeds: [embed] })
      } else if (result.result === 'win') {
        const embed = MinaEmbed.success()
          .setTitle('tic tac toe champion')
          .setDescription(mina.sayf('fun.tictactoe.winResult', { winner }))
          .setTimestamp()

        interaction.followUp({ embeds: [embed] })
      }
    })
    return
  },
}

export default command
