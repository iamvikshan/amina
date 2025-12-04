import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js'
import { Logger } from '@helpers/Logger'

const command: CommandData = {
  name: 'say',
  description: 'speak through me in any channel you choose',
  category: 'ADMIN',
  botPermissions: ['SendMessages'],
  userPermissions: ['ManageMessages'],

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'message',
        description: 'the message content to send',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'channel',
        description: 'target channel for the message',
        type: ApplicationCommandOptionType.Channel,
        required: false,
      },
      {
        name: 'message_id',
        description: 'message id to edit or reply to',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: 'edit',
        description: 'edit the specified message instead of sending new',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
      {
        name: 'ping',
        description: 'ping everyone after sending',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const { options } = interaction

    // Retrieve the message content
    const message = options.getString('message', true).replace(/\\n/g, '\n')

    // Retrieve the channel where the message will be sent
    const channel =
      (options.getChannel('channel') as TextChannel) ||
      (interaction.channel as TextChannel)

    // Retrieve the message ID to edit or reply to
    const message_id = options.getString('message_id')

    // Retrieve whether to edit the message specified by message_id
    const edit = options.getBoolean('edit')

    // Retrieve whether to ping everyone in the channel after sending the message
    const ping = options.getBoolean('ping')

    try {
      // If a message ID is provided, retrieve the message and edit or reply to it
      if (message_id) {
        const replyMessage = await channel.messages
          .fetch(message_id)
          .catch(() => null)

        if (!replyMessage) {
          await interaction.followUp({
            content: 'Oopsie! That message ID seems invalid. Please try again!',
            ephemeral: true,
          })
          return
        }

        if (edit) {
          await replyMessage.edit(message)
          await interaction.followUp({
            content: 'Message edited successfully!',
            ephemeral: true,
          })
        } else {
          await replyMessage.reply({
            content: `${message}\n${ping ? '@everyone' : ''}`,
            allowedMentions: { parse: ['everyone', 'roles', 'users'] },
          })
          await interaction.followUp({
            content: 'Message replied successfully!',
            ephemeral: true,
          })
        }
      } else {
        // If no message ID is provided, send a new message
        await channel.send({
          content: message,
          allowedMentions: { parse: ['everyone', 'roles', 'users'] },
        })

        if (ping) {
          setTimeout(async () => {
            await channel.send({
              content: '@everyone',
              allowedMentions: { parse: ['everyone', 'roles', 'users'] },
            })
          }, 2000) // wait 2 seconds before sending the second message
        }

        // Send the final reply
        await interaction.followUp({
          content: 'Your message has been sent!',
          ephemeral: true,
        })
      }
    } catch (error) {
      Logger.error('Error in say command', error)
      await interaction.followUp({
        content:
          'Oh no! An error occurred while processing this command. Please try again later!',
        ephemeral: true,
      })
    }
  },
}

export default command
