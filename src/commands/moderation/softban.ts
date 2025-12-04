import { softbanTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MODERATION } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'softban',
  description: 'kick a member and delete their recent messages in one action',
  category: 'MODERATION',
  botPermissions: ['BanMembers'],
  userPermissions: ['KickMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'user',
        description: 'the target member',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'reason for softban',
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
          MinaEmbed.error(
            mina.sayf('error.specifyUser', { action: 'softban' })
          ),
        ],
      })
      return
    }

    if (!interaction.guild) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
      return
    }

    let target: GuildMember
    try {
      target = await interaction.guild.members.fetch(user.id)
    } catch (error) {
      ;(interaction.client as any).logger.error(
        'Failed to fetch guild member in softban command:',
        error
      )
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('error.notInServer'))],
      })
      return
    }

    const response = await softban(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
    return
  },
}

async function softban(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> {
  const response = await softbanTarget(
    issuer,
    target,
    reason || mina.say('error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.mod('softban').setDescription(
          mina.sayf('moderation.softban', { target: target.user.username })
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
            action: 'softban',
            target: target.user.username,
          })
        ),
      ],
    }
  }
}

export default command
