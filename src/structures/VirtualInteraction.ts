import {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Message,
  type TextBasedChannel,
  User,
  type InteractionReplyOptions,
  type InteractionEditReplyOptions,
  MessagePayload,
  InteractionResponse,
  Client,
} from 'discord.js'

/**
 * A virtual interaction class that mimics ChatInputCommandInteraction
 * Allows executing existing slash commands via AI triggers
 */
export class VirtualInteraction {
  readonly client: Client
  readonly guild: Guild | null
  readonly channel: TextBasedChannel | null
  readonly member: GuildMember | null
  readonly user: User
  readonly commandName: string
  readonly options: VirtualOptionResolver
  readonly id: string
  readonly createdTimestamp: number
  readonly token: string = 'virtual-token'
  readonly applicationId: string

  private replied: boolean = false
  private replyMessage: Message | null = null
  private originalMessage: Message

  constructor(
    client: Client,
    originalMessage: Message,
    commandName: string,
    args: Record<string, any>
  ) {
    this.client = client
    this.originalMessage = originalMessage
    this.guild = originalMessage.guild
    this.channel = originalMessage.channel
    this.member = originalMessage.member
    this.user = originalMessage.author
    this.commandName = commandName
    this.id = originalMessage.id
    this.createdTimestamp = Date.now()
    this.applicationId = client.user?.id || ''

    // Create a virtual option resolver
    this.options = new VirtualOptionResolver(args, this.guild)
  }

  isChatInputCommand(): this is ChatInputCommandInteraction {
    return true
  }

  isRepliable(): boolean {
    return true
  }

  async deferReply(_options?: {
    ephemeral?: boolean
    fetchReply?: boolean
  }): Promise<any> {
    // In a virtual context, we might just show a typing indicator
    if (this.channel && 'sendTyping' in this.channel) {
      await this.channel.sendTyping()
    }

    return this.originalMessage // Return something compatible
  }

  async reply(
    options: string | MessagePayload | InteractionReplyOptions
  ): Promise<InteractionResponse | Message> {
    if (this.replied) throw new Error('Already replied')
    this.replied = true

    const content = typeof options === 'string' ? { content: options } : options

    // If ephemeral, we might want to send a DM or just a regular message with a note
    // For now, we'll just send to the channel as the AI is "speaking"

    if (this.channel) {
      // Cast to any to avoid TextBasedChannel issues (it usually has send)
      this.replyMessage = await (this.channel as any).send(content)
      return this.replyMessage as any
    }

    throw new Error('No channel to reply to')
  }

  async editReply(
    options: string | MessagePayload | InteractionEditReplyOptions
  ): Promise<Message> {
    if (!this.replyMessage) {
      // If we haven't replied yet (e.g. deferred), send a new message
      const response = await this.reply(options as any)
      return response as Message
    }

    const content = typeof options === 'string' ? { content: options } : options
    return this.replyMessage.edit(content as any)
  }

  async followUp(
    options: string | MessagePayload | InteractionReplyOptions
  ): Promise<Message> {
    if (this.channel) {
      return (this.channel as any).send(options)
    }
    throw new Error('No channel to follow up in')
  }

  async deleteReply(): Promise<void> {
    if (this.replyMessage) {
      await this.replyMessage.delete()
      this.replyMessage = null
    }
  }

  async fetchReply(): Promise<Message> {
    if (this.replyMessage) return this.replyMessage
    throw new Error('No reply to fetch')
  }

  getOutput(): string | null {
    if (this.replyMessage) {
      return (
        this.replyMessage.content ||
        (this.replyMessage.embeds.length > 0 ? '[Embed Sent]' : null)
      )
    }
    return null
  }
}

/**
 * Mock option resolver to handle arguments passed by AI
 */
class VirtualOptionResolver {
  private args: Record<string, any>
  private guild: Guild | null

  constructor(args: Record<string, any>, guild: Guild | null) {
    this.args = args
    this.guild = guild
  }

  getSubcommand(_required?: boolean): string | null {
    return this.args.subcommand || null
  }

  getSubcommandGroup(_required?: boolean): string | null {
    return this.args.subcommandGroup || null
  }

  getString(name: string, _required?: boolean): string | null {
    return this.args[name] || null
  }

  getInteger(name: string, _required?: boolean): number | null {
    return this.args[name] || null
  }

  getNumber(name: string, _required?: boolean): number | null {
    return this.args[name] || null
  }

  getBoolean(name: string, _required?: boolean): boolean | null {
    return this.args[name] || null
  }

  getUser(name: string, _required?: boolean): User | null {
    const input = this.args[name]
    if (!input) return null

    // 1. Try direct ID lookup
    if (this.guild?.client.users.cache.has(input)) {
      return this.guild.client.users.cache.get(input) || null
    }

    // 2. Try resolving from cache by username/tag/display name
    if (this.guild) {
      const target = this.guild.members.cache.find(
        m =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          m.user.tag.toLowerCase() === input.toLowerCase() ||
          m.displayName.toLowerCase() === input.toLowerCase() ||
          m.id === input.replace(/[<@!>]/g, '') // Handle raw mentions
      )
      if (target) return target.user
    }

    return null
  }

  getMember(name: string, _required?: boolean): GuildMember | null {
    const input = this.args[name]
    if (!input || !this.guild) return null

    // 1. Try direct ID lookup
    if (this.guild.members.cache.has(input)) {
      return this.guild.members.cache.get(input) || null
    }

    // 2. Try resolving from cache
    return (
      this.guild.members.cache.find(
        m =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          m.user.tag.toLowerCase() === input.toLowerCase() ||
          m.displayName.toLowerCase() === input.toLowerCase() ||
          m.id === input.replace(/[<@!>]/g, '')
      ) || null
    )
  }

  getChannel(name: string, _required?: boolean): any | null {
    const id = this.args[name]
    if (!id || !this.guild) return null
    return this.guild.channels.cache.get(id) || null
  }

  getRole(name: string, _required?: boolean): any | null {
    const id = this.args[name]
    if (!id || !this.guild) return null
    return this.guild.roles.cache.get(id) || null
  }

  getAttachment(_name: string, _required?: boolean): any | null {
    return null // AI can't upload attachments yet
  }
}
