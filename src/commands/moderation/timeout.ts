import { timeoutTarget } from '@helpers/ModUtils'
import { MODERATION } from '@src/config'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import ems from 'enhanced-ms'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'timeout',
  description: 'temporarily mute a member for a specified duration',
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
        name: 'duration',
        description: 'the time to timeout the member for',
        type: ApplicationCommandOptionType.String,
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

    if (!user) {
      await interaction.followUp({
        embeds: [
          MinaEmbed.error(
            mina.sayf('error.specifyUser', { action: 'timeout' })
          ),
        ],
      })
      return
    }

    // parse time
    const duration = interaction.options.getString('duration', true)
    const ms = ems(duration)
    if (!ms) {
      return interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('error.invalidDuration'))],
      })
    }

    if (!interaction.guild) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
      return
    }

    const reason = interaction.options.getString('reason')
    const target = await interaction.guild.members.fetch(user.id)

    const response = await timeout(
      interaction.member as GuildMember,
      target,
      ms,
      reason
    )
    await interaction.followUp(response)
    return
  },
}

async function timeout(
  issuer: GuildMember,
  target: GuildMember,
  ms: number,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> {
  if (isNaN(ms)) {
    return {
      embeds: [MinaEmbed.error(mina.say('error.invalidDuration'))],
    }
  }
  const response = await timeoutTarget(
    issuer,
    target,
    ms,
    reason || mina.say('error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.mod('timeout').setDescription(
          mina.sayf('moderation.timeout', { target: target.user.username })
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
  } else if (response === 'ALREADY_TIMEOUT') {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('error.alreadyTimeout', {
            target: target.user.username,
          })
        ),
      ],
    }
  } else {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('error.failed', {
            action: 'timeout',
            target: target.user.username,
          })
        ),
      ],
    }
  }
}

export default command
