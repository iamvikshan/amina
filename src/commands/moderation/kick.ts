import { kickTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MODERATION } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'kick',
  description: 'kick a member from the server (they can rejoin)',
  category: 'MODERATION',
  botPermissions: ['KickMembers'],
  userPermissions: ['KickMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'user',
        description: 'the member to kick',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'reason for kicking them',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!user) {
      await interaction.followUp({
        embeds: [
          MinaEmbed.error(mina.sayf('error.specifyUser', { action: 'kick' })),
        ],
      })
      return
    }

    let target: GuildMember
    try {
      if (!interaction.guild) {
        await interaction.followUp({
          embeds: [MinaEmbed.error(mina.say('serverOnly'))],
        })
        return
      }
      target = await interaction.guild.members.fetch(user.id)
    } catch (error) {
      interaction.client.logger.error(
        'Failed to fetch guild member in kick command:',
        error
      )
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('error.notInServer'))],
      })
      return
    }

    const response = await kick(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
    return
  },
}

async function kick(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> {
  const response = await kickTarget(
    issuer,
    target,
    reason || mina.say('error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.mod('kick').setDescription(
          mina.sayf('moderation.kick', { target: target.user.username })
        ),
      ],
    }
  }
  if (response === 'BOT_PERM') {
    return {
      embeds: [MinaEmbed.error(mina.say('permissions.botMissing'))],
    }
  } else if (response === 'MEMBER_PERM') {
    return {
      embeds: [MinaEmbed.error(mina.say('permissions.missing'))],
    }
  } else {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('error.failed', {
            action: 'kick',
            target: target.user.username,
          })
        ),
      ],
    }
  }
}

export default command
