import { disconnectTarget } from '@helpers/ModUtils'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default async (
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> => {
  const { member } = interaction
  const response = await disconnectTarget(
    member as GuildMember,
    target,
    reason || mina.say('error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.success(
          mina.sayf('moderation.voice.disconnected', {
            target: target.user.username,
          })
        ),
      ],
    }
  }
  if (response === 'MEMBER_PERM') {
    return {
      embeds: [MinaEmbed.error(mina.say('permissions.missing'))],
    }
  }
  if (response === 'BOT_PERM') {
    return {
      embeds: [MinaEmbed.error(mina.say('permissions.botMissing'))],
    }
  }
  if (response === 'NO_VOICE') {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.voice.notInVoice', {
            target: target.user.username,
          })
        ),
      ],
    }
  }
  return {
    embeds: [
      MinaEmbed.error(
        mina.sayf('error.failed', {
          action: 'disconnect',
          target: target.user.username,
        })
      ),
    ],
  }
}
