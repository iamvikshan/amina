// src/structures/BotClient.ts
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  WebhookClient,
  ApplicationCommandType,
} from 'discord.js'
import type { ClientOptions } from 'discord.js'
import { setTimeout } from 'node:timers/promises'
import path from 'path'
import { table } from 'table'
import Logger from '@helpers/Logger'
import Honeybadger from '@helpers/Honeybadger'
import { validateCommand, validateContext } from '@helpers/Validator'
import { schemas } from '@src/database/mongoose'
import CommandCategory from './CommandCategory'
import Manager from '@handlers/manager'
import giveawaysHandler from '@handlers/giveaway'
import { DiscordTogether } from 'discord-together'
import { config, secret } from '@src/config'
import Utils from '@helpers/Utils'

const MAX_SLASH_COMMANDS = 100
const MAX_USER_CONTEXTS = 3
const MAX_MESSAGE_CONTEXTS = 3

/**
 * Helper function to normalize module imports
 * Handles both CommonJS (module.exports) and ES6 (export default) styles
 * @param {any} module - The required module
 * @returns {any} The actual export
 */
function normalizeImport(module: any): any {
  // If module has a default export (ES6/TypeScript), use it
  if (module && typeof module === 'object' && 'default' in module) {
    return module.default
  }
  // Otherwise return as-is (CommonJS)
  return module
}

export default class BotClient extends Client {
  public wait: (ms: number) => Promise<void>
  public config: any
  public slashCommands: Collection<string, any>
  public contextMenus: Collection<string, any>
  private _loadedEventNames: Set<string> = new Set()
  public counterUpdateQueue: any[]
  public joinLeaveWebhook?: WebhookClient
  public musicManager?: any
  public giveawaysManager?: any
  public logger: typeof Logger
  public honeybadger: typeof Honeybadger
  public database: typeof schemas
  public utils: any
  public discordTogether: any

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages, // AI DM support
      ],
      partials: [
        Partials.User,
        Partials.Message,
        Partials.Reaction,
        Partials.Channel,
      ], // AI DM support
      allowedMentions: { repliedUser: false },
      restRequestTimeout: 20000,
    } as ClientOptions)

    this.wait = setTimeout

    // Load configuration
    this.config = config

    // Initialize collections for slash commands and context menus
    this.slashCommands = new Collection()
    this.contextMenus = new Collection()
    this.counterUpdateQueue = []
    // Initialize webhook for join/leave logs if provided
    this.joinLeaveWebhook = secret.LOGS_WEBHOOK
      ? new WebhookClient({ url: secret.LOGS_WEBHOOK })
      : undefined

    // Music Player
    if (this.config.MUSIC.ENABLED) this.musicManager = new Manager(this)

    // Giveaways Manager
    if (this.config.GIVEAWAYS.ENABLED)
      this.giveawaysManager = giveawaysHandler(this)

    // Initialize logger, database schemas, and DiscordTogether
    this.logger = Logger

    // Honeybadger
    this.honeybadger = Honeybadger

    // Database
    this.database = schemas

    // Utils
    this.utils = Utils

    this.discordTogether = new DiscordTogether(this as any)

    // Set up global error handlers with Honeybadger context
    this.setupErrorHandlers()
  }

  // Setup global error handlers
  setupErrorHandlers(): void {
    // Discord.js error events
    this.on('error', error => {
      this.logger.error('Discord Client Error', error)
      void Honeybadger.notify(error, {
        context: {
          event: 'client_error',
        },
      })
    })

    this.on('warn', warning => {
      this.logger.warn(warning)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, _promise) => {
      this.logger.error('Unhandled Promise Rejection', reason)
      void Honeybadger.notify(reason as any, {
        context: {
          event: 'unhandled_rejection',
        },
      })
    })
  }

  async loadEvents(directory: string): Promise<void> {
    // Clear previously loaded event listeners (preserve error/warn from setupErrorHandlers)
    for (const name of this._loadedEventNames) {
      this.removeAllListeners(name)
    }
    this._loadedEventNames.clear()

    const clientEvents: any[] = []
    let success = 0
    let failed = 0

    const files = Utils.recursiveReadDirSync(directory, ['.js', '.ts'])
    for (const filePath of files) {
      const file = path.basename(filePath)
      try {
        const ext = path.extname(file)
        const eventName = path.basename(file, ext)
        const module = await import(`${filePath}?v=${Date.now()}`)
        const event = normalizeImport(module)

        this.on(eventName, event.bind(null, this))
        this._loadedEventNames.add(eventName)
        clientEvents.push([file, '✓'])
        success += 1
      } catch (ex) {
        failed += 1
        this.logger.error(`loadEvent - ${file}`, ex)
      }
    }
    console.log(
      table(clientEvents, {
        header: { alignment: 'center', content: 'Client Events' },
        singleLine: true,
        columns: [{ width: 25 }, { width: 5, alignment: 'center' }],
      })
    )

    this.logger.log(
      `Loaded ${success + failed} events. Success (${success}) Failed (${failed})`
    )
  }

  // Load and register a single command
  loadCommand(cmd: any): void {
    // First check category
    if (
      cmd.category &&
      (CommandCategory as any)[cmd.category]?.enabled === false
    ) {
      this.logger.debug(
        `Skipping Command ${cmd.name}. Category ${cmd.category} is disabled`
      )
      return
    }

    // Check if slash command is enabled
    if (cmd.slashCommand?.enabled) {
      if (this.slashCommands.has(cmd.name)) {
        throw new Error(`Slash Command ${cmd.name} already registered`)
      }

      // Load test/dev commands regardless of GLOBAL setting
      if (cmd.testGuildOnly || cmd.devOnly) {
        this.slashCommands.set(cmd.name, cmd)
        return
      }

      // Only load regular commands if GLOBAL is true
      if (!this.config.INTERACTIONS.GLOBAL) {
        this.logger.debug(
          `Skipping command ${cmd.name}. Command is global but GLOBAL=false`
        )
        return
      }

      // If we get here, either GLOBAL=true or it's a special command
      this.slashCommands.set(cmd.name, cmd)
    } else {
      this.logger.debug(`Skipping slash command /${cmd.name}. Disabled!`)
    }
  }

  async loadCommands(directory: string): Promise<void> {
    this.slashCommands.clear()
    const files = Utils.recursiveReadDirSync(directory, ['.js', '.ts'])
    for (const file of files) {
      try {
        const module = await import(`${file}?v=${Date.now()}`)
        const cmd = normalizeImport(module)
        if (typeof cmd !== 'object') continue
        ;(validateCommand as any)(cmd)
        this.loadCommand(cmd)
      } catch (ex: any) {
        this.logger.error(`Failed to load ${file} Reason: ${ex.message}`)
      }
    }

    this.logger.success(`Loaded ${this.slashCommands.size} slash commands`)
    if (this.slashCommands.size > MAX_SLASH_COMMANDS) {
      throw new Error(
        `A maximum of ${MAX_SLASH_COMMANDS} slash commands can be enabled`
      )
    }
  }

  async loadContexts(directory: string): Promise<void> {
    this.contextMenus.clear()
    const files = Utils.recursiveReadDirSync(directory, ['.js', '.ts'])
    for (const file of files) {
      try {
        const module = await import(`${file}?v=${Date.now()}`)
        const ctx = normalizeImport(module)
        if (typeof ctx !== 'object') continue
        ;(validateContext as any)(ctx)
        if (!ctx.enabled) {
          this.logger.debug(`Skipping context ${ctx.name}. Disabled!`)
          continue
        }
        if (this.contextMenus.has(ctx.name)) {
          throw new Error(`Context already exists with that name`)
        }
        this.contextMenus.set(ctx.name, ctx)
      } catch (ex: any) {
        this.logger.error(`Failed to load ${file} Reason: ${ex.message}`)
      }
    }

    const userContexts = this.contextMenus.filter(
      ctx => ctx.type === ApplicationCommandType.User
    ).size
    const messageContexts = this.contextMenus.filter(
      ctx => ctx.type === ApplicationCommandType.Message
    ).size

    if (userContexts > MAX_USER_CONTEXTS) {
      throw new Error(
        `A maximum of ${MAX_USER_CONTEXTS} USER contexts can be enabled`
      )
    }
    if (messageContexts > MAX_MESSAGE_CONTEXTS) {
      throw new Error(
        `A maximum of ${MAX_MESSAGE_CONTEXTS} MESSAGE contexts can be enabled`
      )
    }

    this.logger.success(`Loaded ${userContexts} USER contexts`)
    this.logger.success(`Loaded ${messageContexts} MESSAGE contexts`)
  }

  // Resolve users based on a search string
  async resolveUsers(search: string, exact = false): Promise<any[]> {
    if (!search || typeof search !== 'string') return []
    const users: any[] = []

    const patternMatch = search.match(/(\d{17,20})/)
    if (patternMatch) {
      const id = patternMatch[1]
      const fetched = await this.users
        .fetch(id, { cache: true })
        .catch(() => {})
      if (fetched) {
        users.push(fetched)
        return users
      }
    }

    const matchingTags = this.users.cache.filter(user => user.tag === search)
    if (exact && matchingTags.size === 1) {
      users.push(matchingTags.first())
    } else {
      matchingTags.forEach(match => users.push(match))
    }

    if (!exact) {
      this.users.cache
        .filter(
          x =>
            x.username === search ||
            x.username.toLowerCase().includes(search.toLowerCase()) ||
            x.tag.toLowerCase().includes(search.toLowerCase())
        )
        .forEach(user => users.push(user))
    }

    return users
  }

  // Generate an invite link for the bot with specific permissions
  getInvite(): string {
    return this.generateInvite({
      scopes: ['bot', 'applications.commands'] as any,
      permissions: [
        'AddReactions',
        'AttachFiles',
        'BanMembers',
        'ChangeNickname',
        'Connect',
        'CreateInstantInvite',
        'DeafenMembers',
        'EmbedLinks',
        'KickMembers',
        'ManageChannels',
        'ManageGuild',
        'ManageMessages',
        'ManageNicknames',
        'ManageRoles',
        'ModerateMembers',
        'MoveMembers',
        'MuteMembers',
        'PrioritySpeaker',
        'ReadMessageHistory',
        'SendMessages',
        'SendMessagesInThreads',
        'Speak',
        'ViewChannel',
      ],
    })
  }
}
