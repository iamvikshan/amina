// @root/src/structures/embeds/MinaEmbed.ts
// Centralized embed factory with mina's styling and context support

import { EmbedBuilder, User, Guild, GuildMember } from 'discord.js'
import type { ColorResolvable, APIEmbedField } from 'discord.js'
import { mina } from '@helpers/mina'

/**
 * Context types for rich embed population
 */
interface UserContext {
  user: User
  showAvatar?: boolean // thumbnail
  showBanner?: boolean // image (if available)
}

interface MemberContext {
  member: GuildMember
  showAvatar?: boolean
  showRoles?: boolean
  showJoinDate?: boolean
}

interface GuildContext {
  guild: Guild
  showIcon?: boolean // author icon or thumbnail
  showBanner?: boolean // image
  showMemberCount?: boolean
}

interface BotContext {
  bot: User
  showAsAuthor?: boolean
}

interface ModerationContext {
  target: User | GuildMember
  moderator: User
  reason?: string
  duration?: string
  caseNumber?: number | string
}

interface EconomyContext {
  user: User
  amount: number
  balance?: number
  currency?: string
}

interface MusicContext {
  track: {
    title: string
    author?: string
    duration?: string
    thumbnail?: string
    url?: string
  }
  requester?: User
  position?: number
  queueLength?: number
}

interface LevelContext {
  user: User
  level: number
  xp?: number
  xpNeeded?: number
  rank?: number
}

/**
 * MinaEmbed - Styled embed factory with context support
 */
export class MinaEmbed extends EmbedBuilder {
  constructor() {
    super()
    // Default to primary crimson color
    this.setColor(mina.color.primary as ColorResolvable)
  }

  // ============================================
  // QUOTE METHODS (appended to description)
  // ============================================

  /**
   * Format quote for display
   * Returns: "quote text" — character - anime
   * @param {string} quote - The quote
   * @param {string} character - The character
   * @param {string} anime - The anime
   * @returns {string} The result string.
   */
  private formatQuote(quote: string, character: string, anime: string): string {
    return `*"${quote}"*\n— ${character} - ${anime}`
  }

  /**
   * Add anime quote to end of description (async)
   * @returns {Promise<this>} A promise that resolves when done.
   */
  async withQuote(): Promise<this> {
    const q = await mina.quote()
    const current = this.data.description || ''
    const quoteLine = this.formatQuote(q.text, q.character, q.anime)
    this.setDescription(`${current}\n\n${quoteLine}`)
    return this
  }

  /**
   * Add anime quote to end of description (sync - uses cache)
   * @returns {this} The result.
   */
  withQuoteSync(): this {
    const q = mina.quoteSync()
    const current = this.data.description || ''
    const quoteLine = this.formatQuote(q.text, q.character, q.anime)
    this.setDescription(`${current}\n\n${quoteLine}`)
    return this
  }

  /**
   * Conditionally add quote based on probability (sync)
   * @param {number} probability - 0-1 chance of including quote
   * @returns {this} The result.
   */
  withQuoteProbability(probability: number): this {
    if (Math.random() < probability) {
      return this.withQuoteSync()
    }
    return this
  }

  /**
   * Add quote with chance and tip with chance (sync)
   * @param {number} quoteChance - 0-1 chance of quote
   * @param {number} tipChance - 0-1 chance of footer tip (only if no quote)
   * @returns {this} The result.
   */
  withRandomExtras(quoteChance: number, tipChance: number = 0.3): this {
    if (Math.random() < quoteChance) {
      this.withQuoteSync()
    } else if (Math.random() < tipChance) {
      this.withTip()
    }
    return this
  }

  // ============================================
  // FOOTER METHODS (tips only)
  // ============================================

  /**
   * Add footer with random tip
   * @returns {this} The result.
   */
  withTip(): this {
    this.setFooter({ text: `tip: ${mina.tip()}` })
    return this
  }

  /**
   * Add custom footer
   * @param {string} text - The text content
   * @param {string} iconURL - The icon u r l
   * @returns {this} The result.
   */
  withFooter(text: string, iconURL?: string): this {
    this.setFooter({ text, ...(iconURL !== undefined && { iconURL }) })
    return this
  }

  /**
   * Add contextual footer (randomly picks tip or nothing)
   * 40% chance to show a tip
   * @returns {this} The result.
   */
  withRandomFooter(): this {
    if (Math.random() < 0.4) {
      return this.withTip()
    }
    return this
  }

  // ============================================
  // CONTEXT METHODS
  // ============================================

  /**
   * Apply user context to embed
   * @param {UserContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withUser(ctx: UserContext): this {
    if (ctx.showAvatar !== false) {
      this.setThumbnail(ctx.user.displayAvatarURL({ size: 256 }))
    }
    if (ctx.showBanner && ctx.user.banner) {
      this.setImage(ctx.user.bannerURL({ size: 512 }) || null)
    }
    return this
  }

  /**
   * Apply member context to embed
   * @param {MemberContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withMember(ctx: MemberContext): this {
    if (ctx.showAvatar !== false) {
      this.setThumbnail(ctx.member.displayAvatarURL({ size: 256 }))
    }

    const fields: APIEmbedField[] = []

    if (ctx.showJoinDate && ctx.member.joinedAt) {
      fields.push({
        name: 'joined',
        value: `<t:${Math.floor(ctx.member.joinedAt.getTime() / 1000)}:R>`,
        inline: true,
      })
    }

    if (ctx.showRoles) {
      const roles = ctx.member.roles.cache
        .filter(r => r.id !== ctx.member.guild.id)
        .sort((a, b) => b.position - a.position)
        .first(5)
        .map(r => r.toString())
        .join(' ')
      if (roles) {
        fields.push({
          name: 'roles',
          value: roles,
          inline: true,
        })
      }
    }

    if (fields.length > 0) {
      this.addFields(fields)
    }

    return this
  }

  /**
   * Apply guild context to embed
   * @param {GuildContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withGuild(ctx: GuildContext): this {
    if (ctx.showIcon !== false && ctx.guild.iconURL()) {
      this.setThumbnail(ctx.guild.iconURL({ size: 256 }))
    }

    if (ctx.showBanner && ctx.guild.bannerURL()) {
      this.setImage(ctx.guild.bannerURL({ size: 512 }) || null)
    }

    if (ctx.showMemberCount) {
      this.addFields({
        name: 'members',
        value: ctx.guild.memberCount.toLocaleString(),
        inline: true,
      })
    }

    return this
  }

  /**
   * Apply bot as author
   * @param {BotContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withBot(ctx: BotContext): this {
    if (ctx.showAsAuthor !== false) {
      this.setAuthor({
        name: 'mina',
        iconURL: ctx.bot.displayAvatarURL(),
      })
    }
    return this
  }

  /**
   * Apply moderation context
   * @param {ModerationContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withModeration(ctx: ModerationContext): this {
    const target =
      ctx.target instanceof GuildMember ? ctx.target.user : ctx.target

    this.setThumbnail(target.displayAvatarURL({ size: 256 }))

    const fields: APIEmbedField[] = [
      { name: 'user', value: target.tag, inline: true },
      { name: 'by', value: ctx.moderator.tag, inline: true },
    ]

    if (ctx.caseNumber) {
      fields.push({ name: 'case', value: `#${ctx.caseNumber}`, inline: true })
    }

    if (ctx.reason) {
      fields.push({ name: 'reason', value: ctx.reason, inline: false })
    }

    if (ctx.duration) {
      fields.push({ name: 'duration', value: ctx.duration, inline: true })
    }

    this.addFields(fields)
    return this
  }

  /**
   * Apply economy context
   * @param {EconomyContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withEconomy(ctx: EconomyContext): this {
    this.setThumbnail(ctx.user.displayAvatarURL({ size: 256 }))

    const currency = ctx.currency || '₪'
    const fields: APIEmbedField[] = [
      {
        name: 'amount',
        value: `${currency}${ctx.amount.toLocaleString()}`,
        inline: true,
      },
    ]

    if (ctx.balance !== undefined) {
      fields.push({
        name: 'balance',
        value: `${currency}${ctx.balance.toLocaleString()}`,
        inline: true,
      })
    }

    this.addFields(fields)
    return this
  }

  /**
   * Apply music context
   * @param {MusicContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withMusic(ctx: MusicContext): this {
    if (ctx.track.thumbnail) {
      this.setThumbnail(ctx.track.thumbnail)
    }

    const fields: APIEmbedField[] = [
      { name: 'track', value: ctx.track.title, inline: false },
    ]

    if (ctx.track.author) {
      fields.push({ name: 'artist', value: ctx.track.author, inline: true })
    }

    if (ctx.track.duration) {
      fields.push({ name: 'duration', value: ctx.track.duration, inline: true })
    }

    if (ctx.requester) {
      fields.push({
        name: 'requested by',
        value: ctx.requester.tag,
        inline: true,
      })
    }

    if (ctx.position !== undefined) {
      fields.push({ name: 'position', value: `#${ctx.position}`, inline: true })
    }

    if (ctx.queueLength !== undefined) {
      fields.push({
        name: 'queue',
        value: `${ctx.queueLength} tracks`,
        inline: true,
      })
    }

    this.addFields(fields)

    if (ctx.track.url) {
      this.setURL(ctx.track.url)
    }

    return this
  }

  /**
   * Apply level/rank context
   * @param {LevelContext} ctx - The context interaction
   * @returns {this} The result.
   */
  withLevel(ctx: LevelContext): this {
    this.setThumbnail(ctx.user.displayAvatarURL({ size: 256 }))

    const fields: APIEmbedField[] = [
      { name: 'level', value: ctx.level.toString(), inline: true },
    ]

    if (ctx.rank !== undefined) {
      fields.push({ name: 'rank', value: `#${ctx.rank}`, inline: true })
    }

    if (ctx.xp !== undefined && ctx.xpNeeded !== undefined) {
      fields.push({
        name: 'xp',
        value: `${ctx.xp.toLocaleString()} / ${ctx.xpNeeded.toLocaleString()}`,
        inline: true,
      })
    }

    this.addFields(fields)
    return this
  }

  // ============================================
  // STATIC FACTORY METHODS (Presets)
  // Quote probabilities: success/info 30%, error/warning 10%, mod 0%
  // ============================================

  /**
   * Success embed (green) - 30% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static success(description?: string): MinaEmbed {
    return new MinaEmbed()
      .setColor(mina.color.success as ColorResolvable)
      .setDescription(description || mina.say('success'))
      .withRandomExtras(0.3)
  }

  /**
   * Error embed (blood red) - 10% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static error(description?: string): MinaEmbed {
    return new MinaEmbed()
      .setColor(mina.color.error as ColorResolvable)
      .setDescription(description || mina.say('error.generic'))
      .withRandomExtras(0.1, 0.2)
  }

  /**
   * Warning embed (amber) - 10% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static warning(description?: string): MinaEmbed {
    return new MinaEmbed()
      .setColor(mina.color.warning as ColorResolvable)
      .setDescription(description || mina.say('warning'))
      .withRandomExtras(0.1, 0.2)
  }

  /**
   * Info embed (cyber blue) - 30% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static info(description?: string): MinaEmbed {
    return new MinaEmbed()
      .setColor(mina.color.info as ColorResolvable)
      .setDescription(description || mina.say('info'))
      .withRandomExtras(0.3)
  }

  /**
   * Primary embed (crimson) - 30% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static primary(description?: string): MinaEmbed {
    const embed = new MinaEmbed().withRandomExtras(0.3)
    if (description) {
      embed.setDescription(description)
    }
    return embed
  }

  /**
   * Secondary embed (electric blue) - 30% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static secondary(description?: string): MinaEmbed {
    const embed = new MinaEmbed()
      .setColor(mina.color.secondary as ColorResolvable)
      .withRandomExtras(0.3)
    if (description) {
      embed.setDescription(description)
    }
    return embed
  }

  /**
   * Gold/Achievement embed - 30% quote chance
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static gold(description?: string): MinaEmbed {
    const embed = new MinaEmbed()
      .setColor(mina.color.gold as ColorResolvable)
      .withRandomExtras(0.3)
    if (description) {
      embed.setDescription(description)
    }
    return embed
  }

  /**
   * Loading embed - no quote/tip (keep clean)
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static loading(description?: string): MinaEmbed {
    return new MinaEmbed()
      .setColor(mina.color.muted as ColorResolvable)
      .setDescription(description || mina.say('loading'))
  }

  /**
   * Moderation action embed - 0% quote (keep professional)
   * @param {Object} action - The action
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static mod(
    action:
      | 'timeout'
      | 'untimeout'
      | 'kick'
      | 'ban'
      | 'unban'
      | 'softban'
      | 'warn',
    description?: string,
  ): MinaEmbed {
    const color = mina.modColors[action] || mina.color.error
    return new MinaEmbed()
      .setColor(color as ColorResolvable)
      .setDescription(description || mina.say(`moderation.${action}`))
    // No withRandomExtras - mod embeds stay clean
  }

  /**
   * Plain embed - no automatic quote/tip
   * Use when you want full control
   * @param {string} description - The description
   * @returns {MinaEmbed} The result.
   */
  static plain(description?: string): MinaEmbed {
    const embed = new MinaEmbed()
    if (description) {
      embed.setDescription(description)
    }
    return embed
  }
}
