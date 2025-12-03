import { unDeafenTarget } from '@helpers/ModUtils'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default async (
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  reason: string | null
): Promise<string | { embeds: MinaEmbed[] }> => {
  const { member } = interaction
  const response = await unDeafenTarget(
    member as GuildMember,
    target,
    reason || mina.say('moderation.error.noReason')
  )
  if (typeof response === 'boolean') {
    return {
      embeds: [
        MinaEmbed.success(
          mina.sayf('moderation.voice.undeafened', {
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
  if (response === 'NOT_DEAFENED') {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.voice.notDeafened', {
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
          action: 'undeafen',
          target: target.user.username,
        })
      ),
    ],
  }
}
