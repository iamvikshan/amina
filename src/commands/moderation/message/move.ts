import { moveTarget } from '@helpers/ModUtils'
import {
  ChatInputCommandInteraction,
  GuildMember,
  VoiceChannel,
  StageChannel,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default async (
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  reason: string | null,
  channel: VoiceChannel | StageChannel
): Promise<string | { embeds: MinaEmbed[] }> => {
  const { member } = interaction
  const response = await moveTarget(
    member as GuildMember,
    target,
    reason || mina.say('moderation.error.noReason'),
    channel
  )

  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.success(
          mina.sayf('moderation.voice.moved', {
            target: target.user.username,
            channel: channel.name,
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
  if (response === 'SAME_CHANNEL') {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.voice.sameChannel', {
            target: target.user.username,
          })
        ),
      ],
    }
  }
  return {
    embeds: [
      MinaEmbed.error(
        mina.sayf('moderation.error.failed', {
          action: 'move',
          target: target.user.username,
        })
      ),
    ],
  }
}
