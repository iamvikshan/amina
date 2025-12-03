import { unTimeoutTarget } from '@helpers/ModUtils'
import { MODERATION } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'untimeout',
  description: 'remove timeout from a member',
  category: 'MODERATION',
  botPermissions: ['ModerateMembers'],
  userPermissions: ['ModerateMembers'],

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
        description: 'reason for timeout',
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
            mina.sayf('moderation.error.specifyUser', { action: 'untimeout' })
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

    const target = await interaction.guild.members.fetch(user.id)

    const response = await untimeout(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
    return
  },
}

async function untimeout(
  issuer: GuildMember,
  target: GuildMember,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> {
  const response = await unTimeoutTarget(
    issuer,
    target,
    reason || mina.say('moderation.error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.mod('untimeout').setDescription(
          mina.sayf('moderation.untimeout', { target: target.user.username })
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
  } else if (response === 'NO_TIMEOUT') {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.error.noTimeout', {
            target: target.user.username,
          })
        ),
      ],
    }
  } else {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.error.failed', {
            action: 'untimeout',
            target: target.user.username,
          })
        ),
      ],
    }
  }
}

export default command
