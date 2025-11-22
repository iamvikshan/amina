// @root/src/services/aiResponder.ts

import type { Message } from 'discord.js'
import { getSettings } from '../database/schemas/Guild'
import { configCache } from '../config/aiResponder'
import { GoogleAiClient } from '../helpers/googleAiClient'
// ConversationMessage is now globally available - see types/services.d.ts
import {
  conversationBuffer,
  type Message as BufferMessage,
} from '../structures/conversationBuffer'
import { memoryService } from './memoryService'
import Logger from '../helpers/Logger'
import { config } from '../config'
import { extractMediaFromMessage } from '../helpers/mediaExtractor'
import { aiCommandRegistry } from './aiCommandRegistry'
import { VirtualInteraction } from '../structures/VirtualInteraction'
import { BotClient } from '../structures'

const logger = Logger

// ResponseMode and RateLimitEntry are now globally available - see types/services.d.ts

export class AiResponderService {
  private client: GoogleAiClient | null = null
  private rateLimits: Map<string, RateLimitEntry> = new Map()
  private failureCount: Map<string, number[]> = new Map() // guildId -> timestamps
  private readonly USER_COOLDOWN_MS = 3000 // 3 seconds per user
  private readonly CHANNEL_COOLDOWN_MS = 1000 // 1 second per channel in free-will
  private readonly FAILURE_THRESHOLD = 5
  private readonly FAILURE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
  // Track current client config to avoid unnecessary recreation
  private currentClientConfig: {
    model: string
    timeoutMs: number
    geminiKey: string
  } | null = null
  // private readonly MAX_FREEWILL_CHANNELS = 2 // Max channels for regular guilds (unlimited for test guild)

  /**
   * Check if a guild is the test guild
   */
  private isTestGuild(guildId: string | null): boolean {
    if (!guildId) return false
    return guildId === config.BOT.TEST_GUILD_ID
  }

  /**
   * Get free-will channels from guild settings
   */
  private getFreeWillChannels(guildSettings: any): string[] {
    if (!guildSettings?.aiResponder) return []
    return guildSettings.aiResponder.freeWillChannels || []
  }

  /**
   * Check if a message is a reply to the bot
   * Fetches the referenced message and verifies it's from the bot
   */
  private async isReplyToBot(message: Message): Promise<boolean> {
    if (!message.reference?.messageId || !message.client.user) {
      return false
    }

    try {
      const referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      )
      return referencedMessage.author.id === message.client.user.id
    } catch (error) {
      // If we can't fetch the message (deleted, no permissions, etc.), assume it's not a reply to bot
      logger.debug(
        `Could not fetch referenced message ${message.reference.messageId}: ${error}`
      )
      return false
    }
  }

  async initialize() {
    try {
      const config = await configCache.getConfig()

      logger.debug(
        `AI Config loaded - Enabled: ${config.globallyEnabled}, Model: ${config.model}, HasKey: ${!!config.geminiKey}`
      )

      if (config.globallyEnabled && config.geminiKey) {
        // Only recreate client if model, timeout, or key changed
        const needsClientRecreation =
          !this.currentClientConfig ||
          this.currentClientConfig.model !== config.model ||
          this.currentClientConfig.timeoutMs !== config.timeoutMs ||
          this.currentClientConfig.geminiKey !== config.geminiKey

        if (needsClientRecreation) {
          this.client = new GoogleAiClient(
            config.geminiKey,
            config.model,
            config.timeoutMs
          )
          this.currentClientConfig = {
            model: config.model,
            timeoutMs: config.timeoutMs,
            geminiKey: config.geminiKey,
          }
          logger.success(
            `AI Responder initialized - Model: ${config.model}, Timeout: ${config.timeoutMs}ms`
          )
        } else {
          logger.debug(
            'AI Responder config unchanged, skipping client recreation'
          )
        }
      } else {
        // Disable client if globally disabled or no key
        if (this.client) {
          this.client = null
          this.currentClientConfig = null
          logger.log('AI Responder disabled (global toggle off or no key)')
        }
      }
    } catch (error: any) {
      logger.error(`Failed to initialize AI Responder: ${error.message}`, error)
    }
  }

  async shouldRespond(message: Message): Promise<ResponseMode> {
    try {
      // Filter out bots, system messages, webhooks
      if (message.author.bot || message.system || message.webhookId) {
        return false
      }

      // Parallelize initial fetches: User Data and Config
      const { getUser } = await import('@schemas/User')
      const [userData, config] = await Promise.all([
        getUser(message.author),
        configCache.getConfig(),
      ])

      // Check user ignoreMe preference (fail early)
      if (userData.minaAi?.ignoreMe) {
        // Send helpful message if they try to interact (DM or mention)
        if (!message.guild || message.mentions.has(message.client.user!)) {
          if ('send' in message.channel) {
            await message.channel
              .send({
                content: `I've been set to ignore you. You can change this in \`/mina-ai\` → Settings → Toggle "Ignore Me" off.`,
              })
              .catch(() => {})
          }
        }
        return false
      }

      // Check global toggle
      if (!config.globallyEnabled || !this.client) {
        return false
      }

      // DM handling
      if (!message.guild) {
        // Check global DM enable (developer control)
        if (!config.dmEnabledGlobally) {
          return false
        }
        // Check user-level DM preference
        if (!userData.minaAi?.allowDMs) {
          return false
        }
        return 'dm'
      }

      // Guild channel handling
      // Parallelize guild settings and reply check
      const [guildSettings, isReplyToBot] = await Promise.all([
        getSettings(message.guild),
        this.isReplyToBot(message),
      ])

      if (!guildSettings.aiResponder?.enabled) {
        return false
      }

      // Check if guild has too many failures
      if (this.isGuildDisabled(message.guild.id)) {
        return false
      }

      const freeWillChannels = this.getFreeWillChannels(guildSettings)
      const isTestGuild = this.isTestGuild(message.guild.id)
      const isFreeWillChannel = freeWillChannels.includes(message.channel.id)

      // Check for explicit @mentions
      const hasExplicitMention = message.mentions.has(message.client.user!)

      // For free-will channels, we check if mentioned/replied (for helpful tip), but respond to everything
      // For mention-only mode, we need to verify it's actually targeting the bot
      const isMentioned = hasExplicitMention || isReplyToBot

      // Test guild: Allow both mention mode AND free-will simultaneously
      if (isTestGuild) {
        // Free will channels always work (no mention needed)
        if (isFreeWillChannel) {
          return 'freeWill'
        }
        // Mentions work in any channel (even when mentionOnly is false)
        if (isMentioned) {
          return 'mention'
        }
        return false
      }

      // Regular guild: Mutually exclusive (mention-only OR free-will, not both)
      if (isFreeWillChannel && !guildSettings.aiResponder.mentionOnly) {
        // If mentioned in free-will channel, show helpful message
        if (isMentioned) {
          // We'll handle the helpful message in handleMessage
          return 'freeWill'
        }
        return 'freeWill'
      }

      // Mention mode (only if not in free-will channel or mentionOnly is true)
      // Only respond if explicitly @mentioned OR replying to bot's message
      if (
        guildSettings.aiResponder.mentionOnly &&
        isMentioned &&
        !isFreeWillChannel
      ) {
        return 'mention'
      }

      return false
    } catch (error: any) {
      logger.error(`Error in shouldRespond: ${error.message}`, error)
      return false
    }
  }

  async handleMessage(message: Message, mode: ResponseMode): Promise<void> {
    if (!mode || !this.client) return

    try {
      // Initialize registry if needed (lazy init)
      aiCommandRegistry.initialize(message.client as BotClient)

      // Check if user @mentioned in a non-free-will channel and show helpful tip about free will channels
      if (message.guild && mode === 'mention') {
        const guildSettings = await getSettings(message.guild)
        const freeWillChannels = this.getFreeWillChannels(guildSettings)

        // Only show tip if there are free will channels configured
        if (freeWillChannels.length > 0) {
          const channelMentions = freeWillChannels
            .map(id => `<#${id}>`)
            .join(' or ')
          if ('send' in message.channel) {
            await message.channel
              .send({
                content: `💡 **Tip:** I'm also active in ${channelMentions}! You don't need to @mention me there - just send a message and I'll respond. You can also DM me anytime! ✨`,
              })
              .catch(() => {})
          }
        }
      }

      // Rate limiting
      if (this.isRateLimited(message, mode)) {
        logger.debug(
          `Message rate limited - User: ${message.author.id}, Channel: ${message.channel.id}`
        )
        return
      }

      // Show typing indicator
      if ('sendTyping' in message.channel) {
        await message.channel.sendTyping()
      }

      // Build conversation context
      const conversationId = this.getConversationId(message)

      // Get history BEFORE appending current message
      let history = conversationBuffer.getHistory(conversationId)

      // Validate: history must start with 'user' role (Google AI requirement)
      while (history.length > 0 && history[0].role !== 'user') {
        history.shift() // Remove leading 'model' messages
      }

      // Append user message to buffer for next interaction
      conversationBuffer.append(
        conversationId,
        'user',
        message.content,
        message.author.id,
        message.author.username,
        message.member?.displayName || message.author.username
      )

      const config = await configCache.getConfig()

      // Get active participants (hybrid: message count + time window)
      const participants = this.getActiveParticipants(
        history,
        message.author.id
      )
      const participantIds = Array.from(participants)

      // Fetch profiles for all participants (parallel)
      const participantProfiles =
        await this.getParticipantProfiles(participantIds)

      // Build participant context section (parallelize user fetches)
      let participantContext = ''
      if (participantIds.length > 1) {
        // Only show context if there are multiple participants
        participantContext = '\n\n**Conversation Participants:**\n'

        // Parallelize Discord user fetches
        const userFetchPromises = participantIds.map(async userId => {
          const profile = participantProfiles.get(userId)
          if (!profile) return null

          try {
            const user = await message.client.users
              .fetch(userId)
              .catch(() => null)
            if (!user) return null

            const name =
              message.guild?.members.cache.get(userId)?.displayName ||
              user.username

            let context = `\n**${name}** (${user.username}):\n`

            // Respect privacy settings
            if (profile.privacy?.showPronouns && profile.pronouns) {
              context += `- Pronouns: ${profile.pronouns}\n`
            }
            if (profile.bio) {
              context += `- Bio: ${profile.bio.substring(0, 200)}\n`
            }
            if (profile.interests?.length > 0) {
              context += `- Interests: ${profile.interests.join(', ')}\n`
            }
            if (profile.privacy?.showRegion && profile.region) {
              context += `- Region: ${profile.region}\n`
            }
            if (profile.timezone) {
              context += `- Timezone: ${profile.timezone}\n`
            }

            return context
          } catch (error: any) {
            logger.debug(
              `Failed to fetch Discord user ${userId}: ${error.message}`
            )
            return null
          }
        })

        const userContexts = await Promise.all(userFetchPromises)
        participantContext += userContexts.filter(ctx => ctx !== null).join('')
      }

      // Recall relevant memories for all active participants (parallelized)
      const guildId = message.guild?.id || null
      const allMemories = new Map<string, any[]>() // userId -> RecalledMemory[]

      // Parallelize memory recall for all participants
      const { getUser } = await import('@schemas/User')
      const memoryRecallPromises = participantIds.map(async userId => {
        try {
          // Get user preferences for this participant
          const participantUser = { id: userId } as any
          const participantUserData = await getUser(participantUser)

          const userMemories = await memoryService.recallMemories(
            message.content, // Use current message for relevance
            userId,
            guildId,
            3, // Fewer per user to avoid token bloat
            {
              combineDmWithServer:
                participantUserData.minaAi?.combineDmWithServer || false,
              globalServerMemories:
                participantUserData.minaAi?.globalServerMemories !== false,
            }
          )

          return { userId, memories: userMemories }
        } catch (error: any) {
          logger.debug(
            `Failed to recall memories for user ${userId}: ${error.message}`
          )
          return { userId, memories: [] }
        }
      })

      const memoryResults = await Promise.all(memoryRecallPromises)
      for (const { userId, memories } of memoryResults) {
        if (memories.length > 0) {
          allMemories.set(userId, memories)
        }
      }

      // Build memory context grouped by user (parallelize user fetches)
      let memoryContext = ''
      if (allMemories.size > 0) {
        memoryContext = '\n\n**Relevant Memories by Participant:**\n'

        // Parallelize Discord user fetches for memory context
        const memoryContextPromises = Array.from(allMemories.entries()).map(
          async ([userId, memories]) => {
            if (memories.length === 0) return null

            try {
              const user = await message.client.users
                .fetch(userId)
                .catch(() => null)
              if (!user) return null

              const name =
                message.guild?.members.cache.get(userId)?.displayName ||
                user.username

              let context = `\n**${name}:**\n`
              memories.forEach(m => {
                context += `- ${m.key}: ${m.value}\n`
              })
              return context
            } catch (error: any) {
              logger.debug(`Failed to fetch user ${userId} for memory context`)
              return null
            }
          }
        )

        const contexts = await Promise.all(memoryContextPromises)
        memoryContext += contexts.filter(ctx => ctx !== null).join('')
      }

      // Build enhanced prompt with memories and participant context
      let enhancedPrompt = config.systemPrompt
      if (memoryContext) {
        enhancedPrompt += memoryContext
      }
      if (participantContext) {
        enhancedPrompt += participantContext
      }

      const totalMemories = Array.from(allMemories.values()).reduce(
        (sum, mems) => sum + mems.length,
        0
      )
      // Note: Model will be logged after media detection
      logger.debug(
        `💬 Generating AI response - Participants: ${participantIds.length}, Total Memories: ${totalMemories}, History: ${history.length} messages`
      )

      // Log what we're sending to help debug
      logger.debug(`User message: ${message.content.substring(0, 100)}`)

      // Extract media from message (images, videos, GIFs)
      const mediaItems = extractMediaFromMessage(message)
      const hasMediaContent = mediaItems.length > 0

      if (!this.client) {
        logger.warn('No AI client available for response')
        return
      }

      // Log media detection for debugging
      if (hasMediaContent) {
        console.log(
          `📸 Media detected: ${mediaItems.length} item(s) - ${mediaItems.map(m => `${m.mimeType}${m.isVideo ? ' (video)' : m.isGif ? ' (gif)' : ''}`).join(', ')}`
        )
      }

      // Format history with speaker attribution for AI
      const formattedHistory = this.formatHistoryForAI(history)

      // Get tools from registry
      const tools = aiCommandRegistry.getTools()

      // Generate response with media if present (gemini-flash-latest supports multimodal)
      const result = await this.client.generateResponse(
        enhancedPrompt,
        formattedHistory,
        message.content ||
          (hasMediaContent ? 'What do you see in this image?' : ''),
        config.maxTokens,
        config.temperature,
        hasMediaContent ? mediaItems : undefined,
        tools
      )

      // Handle function calls
      if (result.functionCalls && result.functionCalls.length > 0) {
        for (const call of result.functionCalls) {
          const commandName = call.name
          const args = call.args

          logger.debug(`🤖 AI triggering command: /${commandName}`, args)

          // 1. Append function call to history so AI remembers it tried to run this
          conversationBuffer.append(
            conversationId,
            'model',
            `[System: Executing command /${commandName} with args: ${JSON.stringify(args)}]`
          )

          const command = aiCommandRegistry.getCommand(commandName)
          if (command) {
            const virtualInteraction = new VirtualInteraction(
              message.client,
              message,
              commandName,
              args
            )

            try {
              await command.interactionRun(virtualInteraction as any, {
                settings: message.guild
                  ? await getSettings(message.guild)
                  : undefined,
              })

              // 2. Capture output and feed back to AI
              const output = virtualInteraction.getOutput()
              if (output) {
                conversationBuffer.append(
                  conversationId,
                  'user', // Using 'user' role to simulate system feedback in the next turn
                  `[System: Command /${commandName} executed. Output: ${output}]`
                )
              } else {
                conversationBuffer.append(
                  conversationId,
                  'user',
                  `[System: Command /${commandName} executed successfully (no output captured)]`
                )
              }
            } catch (err: any) {
              logger.error(
                `Failed to execute AI command ${commandName}: ${err.message}`
              )
              // 3. Feed error back to AI
              conversationBuffer.append(
                conversationId,
                'user',
                `[System: Command /${commandName} failed. Error: ${err.message}]`
              )

              await message.reply(
                `I tried to run \`/${commandName}\` but something went wrong! 😣`
              )
            }
          } else {
            conversationBuffer.append(
              conversationId,
              'user',
              `[System: Command /${commandName} not found]`
            )
          }
        }
      }

      // Send text reply if present
      if (result.text) {
        await message.reply(result.text)
        // Append bot response to conversation buffer
        conversationBuffer.append(conversationId, 'model', result.text)
      }

      // Extract and store memories (async, don't block)
      this.extractAndStoreMemories(message, history).catch(err =>
        logger.warn(`Failed to extract memories: ${err.message}`)
      )

      // Log success
      logger.debug(
        `AI response sent - Latency: ${result.latency}ms, Mode: ${mode}`
      )

      // Clear failure count on success
      if (message.guild) {
        this.clearFailures(message.guild.id)
      }
    } catch (error: any) {
      logger.warn(
        `AI response failed - Error: ${error.message}, Guild: ${message.guild?.id}, Channel: ${message.channel.id}`
      )

      // Track failure
      if (message.guild) {
        this.recordFailure(message.guild.id)
      }

      // Send fallback message
      await message
        .reply(
          "I'm having trouble thinking right now. Please try again in a moment."
        )
        .catch(() => {
          // Ignore if we can't send fallback
        })
    }
  }

  private getConversationId(message: Message): string {
    if (!message.guild) {
      return `dm:${message.author.id}`
    }
    return `guild:${message.guild.id}:channel:${message.channel.id}`
  }

  private isRateLimited(message: Message, mode: ResponseMode): boolean {
    const userKey = `${message.channel.id}:${message.author.id}`
    const channelKey = `channel:${message.channel.id}`

    const now = Date.now()

    // Per-user cooldown
    const userLimit = this.rateLimits.get(userKey)
    if (userLimit && now - userLimit.timestamp < this.USER_COOLDOWN_MS) {
      return true
    }

    // Per-channel cooldown (free-will only)
    if (mode === 'freeWill') {
      const channelLimit = this.rateLimits.get(channelKey)
      if (
        channelLimit &&
        now - channelLimit.timestamp < this.CHANNEL_COOLDOWN_MS
      ) {
        return true
      }
      this.rateLimits.set(channelKey, { timestamp: now })
    }

    this.rateLimits.set(userKey, { timestamp: now })
    return false
  }

  private recordFailure(guildId: string) {
    const failures = this.failureCount.get(guildId) || []
    failures.push(Date.now())
    this.failureCount.set(guildId, failures)

    // Check if threshold exceeded
    const recentFailures = this.getRecentFailures(guildId)
    if (recentFailures >= this.FAILURE_THRESHOLD) {
      logger.error('AI auto-disabled for guild due to repeated failures', {
        guildId,
        failureCount: recentFailures,
      })
      // Here you could also update the guild settings to disable AI
    }
  }

  private clearFailures(guildId: string) {
    this.failureCount.delete(guildId)
  }

  private getRecentFailures(guildId: string): number {
    const failures = this.failureCount.get(guildId) || []
    const now = Date.now()
    const recent = failures.filter(
      timestamp => now - timestamp < this.FAILURE_WINDOW_MS
    )
    this.failureCount.set(guildId, recent)
    return recent.length
  }

  private isGuildDisabled(guildId: string): boolean {
    return this.getRecentFailures(guildId) >= this.FAILURE_THRESHOLD
  }

  /**
   * Format conversation history with speaker attribution for AI
   * Adds display names to user messages so AI can track who said what
   */
  private formatHistoryForAI(
    history: BufferMessage[]
  ): globalThis.ConversationMessage[] {
    return history.map(msg => {
      if (msg.role === 'model') {
        return { role: 'model', content: msg.content }
      }

      // User message with attribution
      if (msg.userId && msg.displayName) {
        // Format: "Alice: I like pizza"
        const attributedContent = `${msg.displayName}: ${msg.content}`
        return { role: 'user', content: attributedContent }
      }

      // Fallback for old messages without attribution
      return { role: 'user', content: msg.content }
    })
  }

  /**
   * Get active participants using hybrid approach:
   * - Users from last N messages (conversation thread context)
   * - Users who spoke within time window (recent activity)
   * This handles both active conversations and prevents stale participants
   */
  private getActiveParticipants(
    history: BufferMessage[],
    currentUserId: string,
    timeWindowMs: number = 10 * 60 * 1000, // 10 minutes default
    maxMessageLookback: number = 15 // Last 15 messages default
  ): Set<string> {
    const participants = new Set<string>()
    const now = Date.now()

    // Always include current message author
    participants.add(currentUserId)

    // Get users from last N messages (conversation thread)
    const recentMessages = history.slice(-maxMessageLookback)
    for (const msg of recentMessages) {
      if (msg.role === 'user' && msg.userId) {
        participants.add(msg.userId)
      }
    }

    // Also include users who spoke within time window (recent activity)
    for (const msg of history) {
      if (msg.role === 'user' && msg.userId) {
        const messageAge = now - msg.timestamp
        if (messageAge <= timeWindowMs) {
          participants.add(msg.userId)
        }
      }
    }

    logger.debug(
      `Active participants detected: ${participants.size} users (from ${history.length} messages)`
    )

    return participants
  }

  /**
   * Fetch profiles for all participants
   * Respects privacy settings and caches results
   */
  private async getParticipantProfiles(
    userIds: string[]
  ): Promise<Map<string, any>> {
    const profiles = new Map<string, any>()

    // Batch fetch user data
    const { getUser } = await import('@schemas/User')
    const fetchPromises = userIds.map(async userId => {
      try {
        // Create a minimal user object for getUser (it only needs id)
        const user = { id: userId } as any
        const userData = await getUser(user)
        return { userId, userData }
      } catch (error: any) {
        logger.warn(
          `Failed to fetch profile for user ${userId}: ${error.message}`
        )
        return { userId, userData: null }
      }
    })

    const results = await Promise.all(fetchPromises)

    for (const { userId, userData } of results) {
      if (userData?.profile) {
        profiles.set(userId, userData.profile)
      }
    }

    logger.debug(
      `Fetched profiles for ${profiles.size}/${userIds.length} participants`
    )
    return profiles
  }

  private async extractAndStoreMemories(
    message: Message,
    history: any[]
  ): Promise<void> {
    // Only extract if conversation is long enough
    if (history.length < 5) return

    const guildId = message.guild?.id || null
    const userId = message.author.id

    try {
      // Extract memories using AI
      const facts = await memoryService.extractMemories(
        history,
        userId,
        guildId
      )

      // Store each memory
      const conversationSnippet = history
        .slice(-3)
        .map(m => m.content.substring(0, 50))
        .join(' | ')

      for (const fact of facts) {
        await memoryService.storeMemory(
          fact,
          userId,
          guildId,
          conversationSnippet
        )
      }

      if (facts.length > 0) {
        logger.debug(`Stored ${facts.length} new memories for user ${userId}`)
      }
    } catch (error: any) {
      logger.warn(`Memory extraction failed: ${error.message}`)
    }
  }
}

// Singleton instance
export const aiResponderService = new AiResponderService()
