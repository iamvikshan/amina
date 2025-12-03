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
  description: 'Kicks the specified member',
  category: 'MODERATION',
  botPermissions: ['KickMembers'],
  userPermissions: ['KickMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'user',
        description: 'The target member',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for kick',
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
            mina.sayf('moderation.error.specifyUser', { action: 'kick' })
          ),
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
    } catch (_error) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('moderation.error.notInServer'))],
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
    reason || mina.say('moderation.error.noReason')
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
          mina.sayf('moderation.error.failed', {
            action: 'kick',
            target: target.user.username,
          })
        ),
      ],
    }
  }
}

export default command
