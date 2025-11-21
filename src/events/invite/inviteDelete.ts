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
  const cachedInvites = getInviteCache(invite?.guild as any)

  // Check if invite code exists in the cache
  if (cachedInvites && cachedInvites.get(invite.code)) {
    cachedInvites.get(invite.code).deletedTimestamp = Date.now()
  }
}
