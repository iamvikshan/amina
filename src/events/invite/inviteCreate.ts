import inviteHandler from '@handlers/invite'
import type { BotClient } from '@src/structures'
import type { Invite } from 'discord.js'

const { getInviteCache, cacheInvite } = inviteHandler

/**
 * Handles invite creation event
 * @param {BotClient} client - The bot client instance
 * @param {Invite} invite - The created invite
 */
export default async (client: BotClient, invite: Invite): Promise<void> => {
  const cachedInvites = getInviteCache(invite?.guild as any)

  // Check if cache for the guild exists and then add it to cache
  if (cachedInvites) {
    cachedInvites.set(invite.code, cacheInvite(invite, false))
  }
}
