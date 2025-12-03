import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { TicTacToe } from 'discord-gamecord'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'tictactoe',
  description: 'Challenge someone to an epic game of Tic Tac Toe!',
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
        description: 'pick your worthy opponent!',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const opponent = interaction.options.getUser('user')
    if (!opponent) {
      return interaction.followUp('Please provide an opponent!')
    }

    // Check if opponent is a bot
    if (opponent.bot) {
      return interaction.followUp({
        content:
          "bots can't play games yet - trust me, i've tried teaching them! pick a human friend instead!",
        ephemeral: true,
      })
    }

    // Check if user is trying to play with themselves
    if (opponent.id === interaction.user.id) {
      return interaction.followUp({
        content:
          "you can't play against yourself - where's the fun in that? invite a friend to join the adventure!",
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
      turnMessage:
        "{emoji} | *bounces excitedly* it's **{player}**'s turn to make a move!",
      winMessage:
        '{emoji} | *jumps with joy* **{player}** won the game! that was amazing!',
      tieMessage: "*spins around* it's a tie! you're both equally awesome!",
      timeoutMessage:
        "*droops* aww, the game timed out! don't leave me hanging next time!",
      playerOnlyMessage:
        'hey there! only {player} and {opponent} can play in this game! but you can start your own adventure with `/tictactoe`!',
    })

    Game.startGame()
    Game.on('gameOver', (result: any) => {
      const winners = result.winner
      const winner = `<@${winners}>`

      if (result.result === 'tie') {
        const embed = MinaEmbed.warning()
          .setTitle('tic tac toe results')
          .setDescription(
            "*spins in circles* what an amazing battle! it's a perfect tie! both of you played brilliantly!"
          )
          .setTimestamp()
        interaction.followUp({ embeds: [embed] })
      } else if (result.result === 'win') {
        const embed = MinaEmbed.success()
          .setTitle('tic tac toe champion!')
          .setDescription(
            `*jumps excitedly* congratulations ${winner}! that was an epic victory!`
          )
          .setTimestamp()

        interaction.followUp({ embeds: [embed] })
      }
    })
    return
  },
}

export default command
