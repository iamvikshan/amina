import inviteHandler from '@handlers/invite'
import type { BotClient } from '@src/structures'
import type { Invite } from 'discord.js'

const { getInviteCache } = inviteHandler

/**
 * Handles invite deletion event
 * @param {BotClient} client - The bot client instance
 * @param {Invite} invite - The deleted invite
 */
export default async (_client: BotClient, invite: Invite): Promise<void> => {
  if (!invite?.guild) return
  const cachedInvites = getInviteCache(invite.guild as any)

  // Check if invite code exists in the cache
  const cached = cachedInvites?.get(invite.code)
  if (cached) {
    cached.deletedTimestamp = Date.now()
  }
}
