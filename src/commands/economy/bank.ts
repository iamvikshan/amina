import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import balance from './sub/balance'
import deposit from './sub/deposit'
import transfer from './sub/transfer'
import withdraw from './sub/withdraw'
import { ECONOMY } from '@src/config'
import { mina } from '@helpers/mina'
import type { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'bank',
  description:
    'manage your virtual wallet - check balance, deposit, withdraw, transfer',
  category: 'ECONOMY',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: ECONOMY.ENABLED,
    options: [
      {
        name: 'balance',
        description: 'view your wallet and bank balance',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: "check another user's balance",
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'deposit',
        description: 'move coins from wallet to bank for safekeeping',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'coins',
            description: 'amount to deposit',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'withdraw',
        description: 'take coins out of your bank into your wallet',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'coins',
            description: 'amount to withdraw',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'transfer',
        description: 'send coins directly to another user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'who to send coins to',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'coins',
            description: 'amount to transfer',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    let response: string | { embeds: MinaEmbed[] }

    // balance
    if (sub === 'balance') {
      const user = interaction.options.getUser('user') || interaction.user
      response = await balance(user)
    }

    // deposit
    else if (sub === 'deposit') {
      const coins = interaction.options.getInteger('coins')
      if (coins === null) {
        response = mina.say('error.invalidAmount')
      } else {
        response = await deposit(interaction.user, coins)
      }
    }

    // withdraw
    else if (sub === 'withdraw') {
      const coins = interaction.options.getInteger('coins')
      if (coins === null) {
        response = mina.say('error.invalidAmount')
      } else {
        response = await withdraw(interaction.user, coins)
      }
    }

    // transfer
    else if (sub === 'transfer') {
      const user = interaction.options.getUser('user')
      const coins = interaction.options.getInteger('coins')
      if (!user) {
        response = mina.say('notFound.user')
      } else if (coins === null) {
        response = mina.say('error.invalidAmount')
      } else {
        response = await transfer(interaction.user, user, coins)
      }
    }

    // fallback
    else {
      response = mina.say('error.generic')
    }

    await interaction.followUp(response)
  },
}

export default command
