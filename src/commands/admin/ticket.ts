import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
  CategoryChannel,
} from 'discord.js'
import { EMBED_COLORS, TICKET } from '@src/config'
import type { CommandData } from '@src/structures/Command'
import { ticketModalSetup, setupLogChannel, setupLimit } from './ticket/setup'
import { setupTicketCategory, removeTicketCategory } from './ticket/category'
import { close, closeAll, addToTicket, removeFromTicket } from './ticket/manage'
import { addTopic, removeTopic, listTopics } from './ticket/topic'

const command: CommandData = {
  name: 'ticket',
  description: 'various ticketing commands',
  category: 'TICKET',
  userPermissions: ['ManageGuild'],

  slashCommand: {
    enabled: TICKET.ENABLED,
    options: [
      {
        name: 'setup',
        description: 'setup a new ticket message',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description:
              'the channel where ticket creation message must be sent',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: 'log',
        description: 'setup log channel for tickets',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'channel where ticket logs must be sent',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: 'limit',
        description: 'set maximum number of concurrent open tickets',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'amount',
            description: 'max number of tickets',
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: 'close',
        description: 'closes the ticket [used in ticket channel only]',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'closeall',
        description: 'closes all open tickets',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'add',
        description:
          'add user to the current ticket channel [used in ticket channel only]',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user_id',
            description: 'the id of the user to add',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'remove',
        description:
          'remove user from the ticket channel [used in ticket channel only]',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the user to remove',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'topic',
        description: 'manage ticket topics',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'list',
            description: 'list all ticket topics',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'add',
            description: 'add a ticket topic',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'topic',
                description: 'the topic name',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'remove a ticket topic',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'topic',
                description: 'the topic to remove',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'category',
        description: 'manage the category for ticket channels',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'set the category for ticket channels',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'category',
                description: 'the category to use for ticket channels',
                type: ApplicationCommandOptionType.Channel,
                channelTypes: [ChannelType.GuildCategory],
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'remove the current ticket category',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: any
  ): Promise<void> {
    const sub = interaction.options.getSubcommand()
    const group = interaction.options.getSubcommandGroup(false)
    let response: string | null | { embeds: any[] } = null

    // Handle ticket category commands
    if (group === 'category') {
      if (sub === 'add') {
        const category = interaction.options.getChannel(
          'category'
        ) as CategoryChannel
        response = await setupTicketCategory(interaction.guild as any, category)
      } else if (sub === 'remove') {
        response = await removeTicketCategory(interaction.guild as any)
      }
    }

    // Handle ticket commands
    else if (!group) {
      if (sub === 'setup') {
        const channel = interaction.options.getChannel('channel') as TextChannel

        if (!interaction.guild?.members.me?.permissions.has('ManageChannels')) {
          await interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setDescription(
                  "Oops! I'm missing the `Manage Channels` permission to create ticket channels. Could you please give me that permission? Pretty please? 🙏"
                ),
            ],
          })
          return
        }

        await interaction.deleteReply()
        return ticketModalSetup(
          {
            guild: interaction.guild,
            channel: interaction.channel as TextChannel,
            member: interaction.member as any,
          },
          channel
        )
      }

      // Log channel
      else if (sub === 'log') {
        const channel = interaction.options.getChannel('channel') as TextChannel
        response = await setupLogChannel(channel, data.settings)
      }

      // Limit
      else if (sub === 'limit') {
        const limit = interaction.options.getInteger('amount', true)
        response = await setupLimit(limit, data.settings)
      }

      // Close
      else if (sub === 'close') {
        response = await close(
          { channel: interaction.channel as TextChannel },
          interaction.user
        )
      }

      // Close all
      else if (sub === 'closeall') {
        response = await closeAll(
          { guild: interaction.guild as any },
          interaction.user
        )
      }

      // Add to ticket
      else if (sub === 'add') {
        const inputId = interaction.options.getString('user_id', true)
        response = await addToTicket(
          { channel: interaction.channel as TextChannel },
          inputId
        )
      }

      // Remove from ticket
      else if (sub === 'remove') {
        const user = interaction.options.getUser('user', true)
        response = await removeFromTicket(
          { channel: interaction.channel as TextChannel },
          user.id
        )
      }
    }

    // Handle ticket topics commands
    else if (group === 'topic') {
      if (sub === 'list') {
        response = listTopics(data)
      } else if (sub === 'add') {
        const topic = interaction.options.getString('topic', true)
        response = await addTopic(data, topic)
      } else if (sub === 'remove') {
        const topic = interaction.options.getString('topic', true)
        response = await removeTopic(data, topic)
      }
    }

    if (response) {
      if (typeof response === 'string') {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(EMBED_COLORS.SUCCESS)
              .setDescription(response),
          ],
        })
      } else {
        await interaction.followUp(response)
      }
    }
  },
}

export default command
