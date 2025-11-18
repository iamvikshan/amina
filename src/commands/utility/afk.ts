import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
} from 'discord.js'
import { getUser, setAfk, removeAfk } from '@schemas/User'
import { EMBED_COLORS } from '@src/config'
import { Logger } from '@helpers/Logger'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'afk',
  description: 'Set your AFK status',
  category: 'UTILITY',
  botPermissions: ['SendMessages', 'EmbedLinks'],

  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'reason',
        description: 'The reason for going AFK',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'duration',
        description: 'Duration in minutes (leave empty for indefinite)',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 43200, // 30 days in minutes
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp('Could not find member information.')
    }

    const reason = interaction.options.getString('reason', true)
    const duration = interaction.options.getInteger('duration')

    try {
      const user = await getUser(member.user)

      if (user.afk?.enabled) {
        return interaction.followUp(
          'You are already AFK! Just send a message to remove AFK status.'
        )
      }

      await setAfk(member.id, reason, duration || null)

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setDescription(
          `You are now AFK${reason ? `: ${reason}` : ''}${duration ? `\nDuration: ${duration} minutes` : ''}\n\nNote: Your AFK status will be removed when you send a message.`
        )

      await interaction.followUp({ embeds: [embed] })

      // If duration is set, schedule AFK removal
      if (duration) {
        setTimeout(async () => {
          try {
            const updatedUser = await getUser(member.user)
            if (updatedUser.afk?.enabled) {
              await removeAfk(member.id)
              const channel = interaction.channel as TextChannel | null
              if (channel && interaction.guild) {
                try {
                  await channel.send(
                    `${member.toString()}, your AFK status has been removed after ${duration} minutes.`
                  )
                } catch (ex) {
                  // Channel might be inaccessible
                  Logger.debug(
                    `Failed to send AFK removal message to channel ${channel.id}`
                  )
                }
              }
            }
          } catch (ex) {
            Logger.error('AFK timeout removal', ex)
          }
        }, duration * 60000)
      }
    } catch (ex) {
      Logger.error('AFK command', ex)
      return interaction.followUp(
        'An error occurred while setting your AFK status. Please try again.'
      )
    }
  },
}

export default command
