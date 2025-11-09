import { Collection, Guild, GuildMember, User, Invite } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { getMember } from '@schemas/Member'

interface CachedInvite {
  code: string
  uses: number
  maxUses: number
  inviterId?: string
  deletedTimestamp?: number
}

interface InviteData {
  tracked: number
  added: number
  fake: number
  left: number
}

const inviteCache = new Collection<string, Collection<string, CachedInvite>>()

const getInviteCache = (
  guild: Guild
): Collection<string, CachedInvite> | undefined => inviteCache.get(guild.id)

const resetInviteCache = (guild: Guild): boolean => inviteCache.delete(guild.id)

const getEffectiveInvites = (
  inviteData: InviteData = { tracked: 0, added: 0, fake: 0, left: 0 }
): number =>
  inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left || 0

const cacheInvite = (invite: Invite | any, isVanity = false): CachedInvite => ({
  code: invite.code,
  uses: invite.uses || 0,
  maxUses: invite.maxUses || 0,
  inviterId: isVanity ? 'VANITY' : invite.inviter?.id,
})

/**
 * This function caches all invites for the provided guild
 */
async function cacheGuildInvites(
  guild: Guild
): Promise<Collection<string, CachedInvite>> {
  if (!guild.members.me?.permissions.has('ManageGuild')) return new Collection()
  const invites = await guild.invites.fetch()

  const tempMap = new Collection<string, CachedInvite>()
  invites.forEach(inv => tempMap.set(inv.code, cacheInvite(inv)))
  if (guild.vanityURLCode) {
    tempMap.set(
      guild.vanityURLCode,
      cacheInvite(await guild.fetchVanityData(), true)
    )
  }

  inviteCache.set(guild.id, tempMap)
  return tempMap
}

/**
 * Add roles to inviter based on invites count
 */
const checkInviteRewards = async (
  guild: Guild,
  inviterData: any = {},
  isAdded: boolean
): Promise<void> => {
  const settings = await getSettings(guild)
  if ((settings as any).invite.ranks.length > 0 && inviterData?.member_id) {
    const inviter = await guild.members
      .fetch(inviterData?.member_id)
      .catch(() => null)
    if (!inviter) return

    const invites = getEffectiveInvites(inviterData.invite_data)
    ;(settings as any).invite.ranks.forEach((reward: any) => {
      if (isAdded) {
        if (invites >= reward.invites && !inviter.roles.cache.has(reward._id)) {
          inviter.roles.add(reward._id)
        }
      } else if (
        invites < reward.invites &&
        inviter.roles.cache.has(reward._id)
      ) {
        inviter.roles.remove(reward._id)
      }
    })
  }
}

/**
 * Track inviter by comparing new invites with cached invites
 */
async function trackJoinedMember(member: GuildMember): Promise<any> {
  const { guild } = member

  if (member.user.bot) return {}

  const cachedInvites = inviteCache.get(guild.id)
  const newInvites = await cacheGuildInvites(guild)

  // return if no cached data
  if (!cachedInvites) return {}
  let usedInvite: CachedInvite | undefined

  // compare newInvites with cached invites
  usedInvite = newInvites.find(inv => {
    const cachedInv = cachedInvites.get(inv.code)
    return inv.uses !== 0 && cachedInv && cachedInv.uses < inv.uses
  })

  // Special case: Invitation was deleted after member's arrival and
  // just before GUILD_MEMBER_ADD (https://github.com/iamvikshan/amina/blob/29202ee8e85bb1651f19a466e2c0721b2373fefb/index.ts#L46)
  if (!usedInvite) {
    cachedInvites
      .sort((a, b) =>
        a.deletedTimestamp && b.deletedTimestamp
          ? b.deletedTimestamp - a.deletedTimestamp
          : 0
      )
      .forEach(invite => {
        if (
          !newInvites.get(invite.code) && // If the invitation is no longer present
          invite.maxUses > 0 && // If the invitation was indeed an invitation with a limited number of uses
          invite.uses === invite.maxUses - 1 // What if the invitation was about to reach the maximum number of uses
        ) {
          usedInvite = invite
        }
      })
  }

  let inviterData: any = {}
  if (usedInvite) {
    const inviterId =
      usedInvite.code === guild.vanityURLCode ? 'VANITY' : usedInvite.inviterId

    // log invite data
    const memberDb = (await getMember(guild.id, member.id)) as any
    memberDb.invite_data.inviter = inviterId
    memberDb.invite_data.code = usedInvite.code
    await memberDb.save()

    // increment inviter's invites
    const inviterDb = (await getMember(guild.id, inviterId || '')) as any
    inviterDb.invite_data.tracked += 1
    await inviterDb.save()
    inviterData = inviterDb
  }

  checkInviteRewards(guild, inviterData, true)
  return inviterData
}

/**
 * Fetch inviter data from database
 */
async function trackLeftMember(guild: Guild, user: User): Promise<any> {
  if (user.bot) return {}

  const settings = await getSettings(guild)
  if (!(settings as any).invite.tracking) return
  const inviteData = ((await getMember(guild.id, user.id)) as any).invite_data

  let inviterData: any = {}
  if (inviteData.inviter) {
    const inviterId =
      inviteData.inviter === 'VANITY' ? 'VANITY' : inviteData.inviter
    const inviterDb = (await getMember(guild.id, inviterId)) as any
    inviterDb.invite_data.left += 1
    await inviterDb.save()
    inviterData = inviterDb
  }

  checkInviteRewards(guild, inviterData, false)
  return inviterData
}

export default {
  getInviteCache,
  resetInviteCache,
  trackJoinedMember,
  trackLeftMember,
  cacheGuildInvites,
  checkInviteRewards,
  getEffectiveInvites,
  cacheInvite,
}

