import { Guild, ChannelType /* type GuildChannel */ } from 'discord.js'

const ROLE_MENTION = /<?@?&?(\d{17,20})>?/
const CHANNEL_MENTION = /<?#?(\d{17,20})>?/
const MEMBER_MENTION = /<?@?!?(\d{17,20})>?/

/**
 * Get all channels that match the query
 * @param query - The search query
 * @param type - Array of channel types to filter by
 */
Guild.prototype.findMatchingChannels = function (
  this: Guild,
  query: string,
  type = [ChannelType.GuildText, ChannelType.GuildAnnouncement]
): any[] /*GuildChannel[]*/ {
  if (!this || !query || typeof query !== 'string') return []

  const channelManager = this.channels.cache.filter(ch =>
    type.includes(ch.type as any)
  )

  const patternMatch = query.match(CHANNEL_MENTION)
  if (patternMatch) {
    const id = patternMatch[1]
    const channel = channelManager.find(r => r.id === id)
    if (channel) return [channel]
  }

  const exact: any[] = []
  const startsWith: any[] = []
  const includes: any[] = []
  channelManager.forEach(ch => {
    const lowerName = ch.name.toLowerCase()
    if (ch.name === query) exact.push(ch)
    if (lowerName.startsWith(query.toLowerCase())) startsWith.push(ch)
    if (lowerName.includes(query.toLowerCase())) includes.push(ch)
  })

  if (exact.length > 0) return exact
  if (startsWith.length > 0) return startsWith
  if (includes.length > 0) return includes
  return []
}

/**
 * Get all voice channels that match the query
 * @param query - The search query
 * @param type - Array of voice channel types to filter by
 */
Guild.prototype.findMatchingVoiceChannels = function (
  this: Guild,
  query: string,
  type = [ChannelType.GuildVoice, ChannelType.GuildStageVoice]
): any[] {
  if (!this || !query || typeof query !== 'string') return []

  const channelManager = this.channels.cache.filter(ch =>
    type.includes(ch.type as any)
  )

  const patternMatch = query.match(CHANNEL_MENTION)
  if (patternMatch) {
    const id = patternMatch[1]
    const channel = channelManager.find(r => r.id === id)
    if (channel) return [channel]
  }

  const exact: any[] = []
  const startsWith: any[] = []
  const includes: any[] = []
  channelManager.forEach(ch => {
    const lowerName = ch.name.toLowerCase()
    if (ch.name === query) exact.push(ch)
    if (lowerName.startsWith(query.toLowerCase())) startsWith.push(ch)
    if (lowerName.includes(query.toLowerCase())) includes.push(ch)
  })

  if (exact.length > 0) return exact
  if (startsWith.length > 0) return startsWith
  if (includes.length > 0) return includes
  return []
}

/**
 * Find all roles that match the query
 * @param query - The search query
 */
Guild.prototype.findMatchingRoles = function (
  this: Guild,
  query: string
): any[] {
  if (!this || !query || typeof query !== 'string') return []

  const patternMatch = query.match(ROLE_MENTION)
  if (patternMatch) {
    const id = patternMatch[1]
    const role = this.roles.cache.find(r => r.id === id)
    if (role) return [role]
  }

  const exact: any[] = []
  const startsWith: any[] = []
  const includes: any[] = []
  this.roles.cache.forEach(role => {
    const lowerName = role.name.toLowerCase()
    if (role.name === query) exact.push(role)
    if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role)
    if (lowerName.includes(query.toLowerCase())) includes.push(role)
  })
  if (exact.length > 0) return exact
  if (startsWith.length > 0) return startsWith
  if (includes.length > 0) return includes
  return []
}

/**
 * Resolves a guild member from search query
 * @param query - The search query
 * @param exact - Whether to perform exact matching
 */
Guild.prototype.resolveMember = async function (
  this: Guild,
  query: string,
  exact: boolean = false
): Promise<any> {
  if (!query || typeof query !== 'string') return

  // Check if mentioned or ID is passed
  const patternMatch = query.match(MEMBER_MENTION)
  if (patternMatch) {
    const id = patternMatch[1]
    const fetched = await this.members.fetch({ user: id }).catch(() => {})
    if (fetched) return fetched
  }

  // Fetch and cache members from API
  await this.members.fetch({ query }).catch(() => {})

  // Check if exact tag is matched
  const matchingTags = this.members.cache.filter(mem => mem.user.tag === query)
  if (matchingTags.size === 1) return matchingTags.first()

  // Check for matching username
  if (!exact) {
    return this.members.cache.find(
      x =>
        x.user.username === query ||
        x.user.username.toLowerCase().includes(query.toLowerCase()) ||
        x.displayName.toLowerCase().includes(query.toLowerCase())
    )
  }
}

/**
 * Fetch member stats
 * @returns Array of [total, bots, members]
 */
Guild.prototype.fetchMemberStats = async function (
  this: Guild
): Promise<number[]> {
  const all = await this.members.fetch()
  const total = all.size
  const bots = all.filter(mem => mem.user.bot).size
  const members = total - bots
  return [total, bots, members]
}
