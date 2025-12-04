import { banTarget } from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  User,
} from 'discord.js'
import { MODERATION } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'ban',
  description: 'permanently ban a member from the server',
  category: 'MODERATION',
  botPermissions: ['BanMembers'],
  userPermissions: ['BanMembers'],

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
        description: 'reason for ban',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason')

    if (!target) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('notFound.user'))],
      })
      return
    }

    const response = await ban(
      interaction.member as GuildMember,
      target,
      reason
    )
    await interaction.followUp(response)
    return
  },
}

async function ban(
  issuer: GuildMember,
  target: User,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> {
  const response = await banTarget(
    issuer,
    target,
    reason || mina.say('moderation.error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.mod('ban').setDescription(
          mina.sayf('moderation.ban', { target: target.username })
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
          mina.sayf('moderation.error.failed', {
            action: 'ban',
            target: target.username,
          })
        ),
      ],
    }
  }
}

export default command
