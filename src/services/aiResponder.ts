// @root/src/services/aiResponder.ts

import type { GuildMember, Message } from 'discord.js'
import { getSettings } from '../database/schemas/Guild'
import { getUser } from '../database/schemas/User'
import { configCache } from '../config/aiResponder'
import { AiClient } from '../helpers/aiClient'
// ConversationMessage is now globally available - see types/services.d.ts
import {
  conversationBuffer,
  ConversationBuffer,
  type Message as BufferMessage,
} from '../structures/conversationBuffer'
import { memoryService } from './memoryService'
import Logger from '../helpers/Logger'
import { config } from '../config'
import { extractMediaFromMessage } from '../helpers/mediaExtractor'
import { aiCommandRegistry } from './aiCommandRegistry'
import { VirtualInteraction } from '../structures/VirtualInteraction'
import aiPermissions from '../data/aiPermissions.json'

const logger = Logger

// ResponseMode and RateLimitEntry are now globally available - see types/services.d.ts

export class AiResponderService {
  private client: AiClient | null = null
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
    authConfig: string // serialized for comparison
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

      // logger.log(
      //   `AI Config loaded - Enabled: ${config.globallyEnabled}, Model: ${config.model}, HasKey: ${!!config.geminiKey}`
      // )

      if (config.globallyEnabled) {
        // Validate credentials based on auth mode
        if (config.authMode === 'api-key' && !config.geminiKey) {
          logger.error(
            'AI globally enabled with api-key mode but GEMINI_KEY is empty'
          )
          this.client = null
          this.currentClientConfig = null
          return
        }
        if (
          config.authMode === 'vertex' &&
          (!config.vertexProjectId ||
            !config.vertexRegion ||
            !config.googleServiceAccountJson ||
            !config.parsedCredentials)
        ) {
          const missing = [
            !config.vertexProjectId && 'vertexProjectId',
            !config.vertexRegion && 'vertexRegion',
            !config.googleServiceAccountJson && 'googleServiceAccountJson',
            !config.parsedCredentials && 'parsedCredentials',
          ].filter(Boolean)
          logger.error(
            `AI globally enabled with vertex mode but missing required credential(s): ${missing.join(', ')}`
          )
          this.client = null
          this.currentClientConfig = null
          return
        }

        // Build auth config — credentials pre-parsed by configCache
        const geminiKey = config.geminiKey ?? ''
        const authConfig: AiAuthConfig =
          config.authMode === 'vertex'
            ? {
                mode: 'vertex',
                project: config.vertexProjectId,
                location: config.vertexRegion,
                credentials: config.parsedCredentials,
              }
            : { mode: 'api-key', apiKey: geminiKey }

        // Fingerprint for change detection — includes credential hash for rotation
        const credentialFingerprint =
          config.authMode === 'vertex' && config.googleServiceAccountJson
            ? Bun.hash(config.googleServiceAccountJson).toString(16).slice(0, 8)
            : config.authMode === 'api-key' && geminiKey
              ? Bun.hash(geminiKey).toString(16).slice(0, 8)
              : 'none'
        const authConfigKey = `${config.authMode}:${
          config.authMode === 'vertex'
            ? `${config.vertexProjectId}:${config.vertexRegion}`
            : 'gemini'
        }:${credentialFingerprint}`

        const needsClientRecreation =
          !this.currentClientConfig ||
          this.currentClientConfig.model !== config.model ||
          this.currentClientConfig.timeoutMs !== config.timeoutMs ||
          this.currentClientConfig.authConfig !== authConfigKey

        if (needsClientRecreation) {
          this.client = new AiClient(authConfig, config.model, config.timeoutMs)
          this.currentClientConfig = {
            model: config.model,
            timeoutMs: config.timeoutMs,
            authConfig: authConfigKey,
          }
          logger.success(
            `AI Responder initialized - Model: ${config.model}, Auth: ${config.authMode}`
          )
        } else {
          logger.debug(
            'AI Responder config unchanged, skipping client recreation'
          )
        }
      } else {
        if (this.client) {
          this.client = null
          this.currentClientConfig = null
          logger.log(
            'AI Responder disabled (global toggle off or no credentials)'
          )
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
      const [userData, config] = await Promise.all([
        getUser(message.author),
        configCache.getConfig(),
      ])

      // Check user ignoreMe preference (fail early)
      if (userData.minaAi?.ignoreMe) {
        // Send helpful message if they try to interact (DM or mention)
        if (
          !message.guild ||
          (message.client.user && message.mentions.has(message.client.user))
        ) {
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
      const hasExplicitMention = message.client.user
        ? message.mentions.has(message.client.user)
        : false

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
            logger.debug(`Failed to fetch Discord user ${userId}`, error)
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
              logger.debug(
                `Failed to fetch user ${userId} for memory context`,
                error
              )
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

      // Extract media from message (images, videos, GIFs)
      const mediaItems = extractMediaFromMessage(message)
      const hasMediaContent = mediaItems.length > 0

      if (!this.client) {
        logger.warn('No AI client available for response')
        return
      }

      // Format history with speaker attribution for AI
      const formattedHistory = this.formatHistoryForAI(history)

      // Get tools from registry
      const tools = aiCommandRegistry.getTools()

      // Generate response with media if present (gemini-flash-latest supports multimodal)
      let result = await this.client.generateResponse(
        enhancedPrompt,
        formattedHistory,
        message.content ||
          (hasMediaContent ? 'What do you see in this image?' : ''),
        config.maxTokens,
        config.temperature,
        hasMediaContent ? mediaItems : undefined,
        tools
      )

      // ReAct Loop: Allow AI to call functions and see results
      const MAX_ITERATIONS = 5 // Safety limit to prevent infinite loops
      let iteration = 0
      let currentHistory = [...formattedHistory]

      while (
        result.functionCalls &&
        result.functionCalls.length > 0 &&
        iteration < MAX_ITERATIONS
      ) {
        iteration++

        // Skip sending intermediate text - we'll let AI comment after seeing the result
        // This keeps chat cleaner: command output → AI commentary
        // TODO!: might want to send intermediate text and delete it after AI responds
        if (result.text && result.text.trim()) {
          // Just add to history so AI has context, but don't send to user
          currentHistory.push({
            role: 'model',
            parts: result.modelContent ?? [{ text: result.text }],
          })
        }

        // Process all function calls in this response
        const functionResults: string[] = []

        for (const call of result.functionCalls) {
          const commandName = call.name
          let args = call.args

          // Check if this is a native tool (memory manipulation, etc.)
          if (aiCommandRegistry.isNativeTool(commandName)) {
            const metadata = aiCommandRegistry.getMetadata(commandName)
            if (metadata) {
              const permissionCheck = await this.checkCommandPermissions(
                message,
                commandName,
                metadata,
                args
              )
              if (!permissionCheck.allowed) {
                functionResults.push(permissionCheck.reason)
                continue
              }
            }

            try {
              const nativeContext = {
                userId: message.author.id,
                guildId: message.guild?.id ?? null,
              }
              const toolResult = await aiCommandRegistry.executeNativeTool(
                commandName,
                args,
                nativeContext
              )
              functionResults.push(toolResult)
            } catch (err: any) {
              logger.error(
                `Failed to execute native tool ${commandName}: ${err.message}`
              )
              functionResults.push(`Tool ${commandName} failed: ${err.message}`)
            }
            continue
          }

          const command = aiCommandRegistry.getCommand(commandName)
          const metadata = aiCommandRegistry.getMetadata(commandName)

          if (!command || !metadata) {
            functionResults.push(
              `Command /${commandName} not found. Available commands may be limited.`
            )
            continue
          }

          // Permission checks based on model
          const permissionCheck = await this.checkCommandPermissions(
            message,
            commandName,
            metadata,
            args
          )

          if (!permissionCheck.allowed) {
            functionResults.push(permissionCheck.reason)
            continue
          }

          // Apply free will limits (e.g., timeout duration cap)
          if (permissionCheck.isFreeWill) {
            args = this.applyFreeWillLimits(commandName, args)
          }

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

            // Capture output for AI context
            const output = virtualInteraction.getOutput()
            const resultText = output
              ? `Command /${commandName} executed successfully. Result:\n${output}`
              : `Command /${commandName} executed successfully (no text output).`

            functionResults.push(resultText)
          } catch (err: any) {
            logger.error(
              `Failed to execute AI command ${commandName}: ${err.message}`
            )
            functionResults.push(
              `Command /${commandName} failed with error: ${err.message}`
            )
          }
        }

        // Feed function results back to AI as a user message (system feedback)
        // Google AI requires history to alternate user/model, so we format this carefully
        const systemFeedback = `[System Feedback]\n${functionResults.join('\n\n')}`

        // If AI sent text with the function call, it's already in history as 'model'
        // If not, we need to add a placeholder so the alternation works
        if (!result.text || !result.text.trim()) {
          currentHistory.push({
            role: 'model',
            parts: [{ text: '[Executing requested commands...]' }],
          })
          conversationBuffer.append(
            conversationId,
            'model',
            '[Executing requested commands...]'
          )
        }

        // Append to conversation buffer for persistence (but NOT to currentHistory - we'll pass it as the message)
        conversationBuffer.append(conversationId, 'user', systemFeedback)

        // Show typing indicator while AI thinks about the results
        if ('sendTyping' in message.channel) {
          await message.channel.sendTyping()
        }

        // Validate history starts with user before calling API
        while (currentHistory.length > 0 && currentHistory[0].role !== 'user') {
          currentHistory.shift()
        }

        // Generate follow-up response with the function results
        // Pass systemFeedback as the current user message (Google AI requires non-empty message)
        result = await this.client.generateResponse(
          enhancedPrompt,
          currentHistory,
          systemFeedback, // Pass system feedback as the current message
          config.maxTokens,
          config.temperature,
          undefined, // No media in follow-up
          tools
        )

        // Add the feedback to history for next iteration (if any)
        currentHistory.push({ role: 'user', parts: [{ text: systemFeedback }] })
      }

      // Send final text reply if present
      if (result.text && result.text.trim()) {
        await message.reply(result.text)
        // Append bot response to conversation buffer with full model content
        conversationBuffer.appendParts(
          conversationId,
          'model',
          result.modelContent ?? [{ text: result.text }]
        )
      }

      // Warn if we hit the iteration limit
      if (iteration >= MAX_ITERATIONS) {
        logger.warn(
          `ReAct loop hit max iterations (${MAX_ITERATIONS}) for message ${message.id}`
        )
      }

      // Extract and store memories (async, don't block)
      this.extractAndStoreMemories(message, history).catch(err =>
        logger.warn(`Failed to extract memories: ${err.message}`)
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

  /**
   * Check if AI can execute a command based on permission model
   */
  private async checkCommandPermissions(
    message: Message,
    commandName: string,
    metadata: {
      permissionModel: string
      userPermissions: any[]
      freeWillAllowed: boolean
    },
    args: Record<string, any>
  ): Promise<{ allowed: boolean; reason: string; isFreeWill: boolean }> {
    const { permissionModel, userPermissions, freeWillAllowed } = metadata

    // Detect if this is likely a user request or AI free will
    const isFreeWill = !this.isLikelyUserRequest(message.content, commandName)

    // Check for prompt injection patterns
    if (this.detectPromptInjection(message.content)) {
      // If injection detected, treat ALL privileged commands as blocked
      if (permissionModel === 'privileged') {
        return {
          allowed: false,
          reason: `Command /${commandName} blocked: Suspicious request pattern detected.`,
          isFreeWill,
        }
      }
    }

    // Open commands: Always allowed
    if (permissionModel === 'open') {
      return { allowed: true, reason: '', isFreeWill }
    }

    // User-request-only commands: Block if AI is acting on its own
    if (permissionModel === 'userRequest') {
      if (isFreeWill) {
        return {
          allowed: false,
          reason: `I can only run /${commandName} if you ask me to! This command affects your account.`,
          isFreeWill,
        }
      }
      return { allowed: true, reason: '', isFreeWill }
    }

    // Privileged commands: Check permissions
    if (permissionModel === 'privileged') {
      // Free will exception (e.g., timeout for self-defense)
      if (isFreeWill && freeWillAllowed) {
        // Additional check: Can't target admins/mods with free will
        const targetCheck = await this.checkTargetHierarchy(message, args)
        if (!targetCheck.allowed) {
          return {
            allowed: false,
            reason: targetCheck.reason,
            isFreeWill,
          }
        }
        return { allowed: true, reason: '', isFreeWill }
        // TODO: Consider notifying/tagging a guild admin when AI uses free will on privileged commands
      }

      // User must have permissions
      if (!message.guild || !message.member) {
        return {
          allowed: false,
          reason: `Command /${commandName} requires server permissions and must be used in a server.`,
          isFreeWill,
        }
      }

      const member = message.member as GuildMember
      if (
        userPermissions.length > 0 &&
        !member.permissions.has(userPermissions)
      ) {
        const permNames = userPermissions.join(', ')
        return {
          allowed: false,
          reason: `You need [${permNames}] permission(s) to use /${commandName}.`,
          isFreeWill,
        }
      }

      return { allowed: true, reason: '', isFreeWill }
    }

    // Default: allow (shouldn't reach here)
    return { allowed: true, reason: '', isFreeWill }
  }

  /**
   * Detect if user message contains prompt injection patterns
   */
  private detectPromptInjection(content: string): boolean {
    const lower = content.toLowerCase()
    return aiPermissions.injectionPatterns.some(pattern =>
      lower.includes(pattern.toLowerCase())
    )
  }

  /**
   * Check if user message likely contains explicit request for this command
   */
  private isLikelyUserRequest(content: string, commandName: string): boolean {
    const lower = content.toLowerCase()

    // Check if user mentioned the command name or related action words
    const actionWords: Record<string, string[]> = {
      timeout: ['timeout', 'mute', 'silence', 'quiet'],
      ban: ['ban', 'remove permanently', 'get rid of'],
      kick: ['kick', 'remove', 'boot'],
      warn: ['warn', 'warning'],
      purge: ['purge', 'delete messages', 'clear messages', 'clean'],
      gamble: ['gamble', 'bet', 'wager'],
      slots: ['slots', 'slot machine'],
      coinflip: ['coinflip', 'flip a coin', 'coin flip'],
      blackjack: ['blackjack', 'play blackjack', '21'],
    }

    // Check command name directly
    if (lower.includes(commandName)) return true

    // Check action words for this command
    const words = actionWords[commandName] || []
    return words.some(word => lower.includes(word))
  }

  /**
   * Check if target user has higher/equal role than bot (for free will actions)
   */
  private async checkTargetHierarchy(
    message: Message,
    args: Record<string, any>
  ): Promise<{ allowed: boolean; reason: string }> {
    if (!message.guild) {
      return { allowed: true, reason: '' }
    }

    // Find target user in args (could be 'user', 'member', 'target', etc.)
    const targetId = args.user || args.member || args.target
    if (!targetId) {
      return { allowed: true, reason: '' }
    }

    try {
      const botMember = message.guild.members.me
      const targetMember = await message.guild.members
        .fetch(targetId)
        .catch(() => null)

      if (!botMember || !targetMember) {
        return { allowed: true, reason: '' }
      }

      // Can't target users with higher or equal role
      if (
        targetMember.roles.highest.position >= botMember.roles.highest.position
      ) {
        return {
          allowed: false,
          reason: `Cannot perform action on ${targetMember.displayName} - they have a higher or equal role than me.`,
        }
      }

      // Can't target server owner
      if (targetMember.id === message.guild.ownerId) {
        return {
          allowed: false,
          reason: `Cannot perform action on the server owner.`,
        }
      }

      return { allowed: true, reason: '' }
    } catch {
      return { allowed: true, reason: '' }
    }
  }

  /**
   * Apply limits to free will command arguments
   */
  private applyFreeWillLimits(
    commandName: string,
    args: Record<string, any>
  ): Record<string, any> {
    const limits = aiPermissions.freeWillLimits as Record<
      string,
      {
        maxDurationSeconds?: number
        maxMessages?: number
        maxPerUser?: number
        requiresReason?: boolean
      }
    >

    if (commandName === 'timeout' && limits.timeout) {
      const maxDuration = limits.timeout.maxDurationSeconds || 300
      if (args.duration && args.duration > maxDuration) {
        args.duration = maxDuration
      }
      // If no duration specified, use a reasonable default
      if (!args.duration) {
        args.duration = 60 // 1 minute default for free will
      }
    }

    if (commandName === 'purge' && limits.purge) {
      const maxMessages = limits.purge.maxMessages || 10
      if (args.amount && args.amount > maxMessages) {
        args.amount = maxMessages
      }
      // If no amount specified, use a conservative default
      if (!args.amount) {
        args.amount = 5
      }
    }

    if (commandName === 'warn' && limits.warn) {
      // Ensure reason is provided for free will warnings
      if (!args.reason) {
        args.reason = 'Automated warning by Mina AI'
      }
    }

    return args
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
    return history.map(msg => ConversationBuffer.formatWithAttribution(msg))
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
        .map(m => ConversationBuffer.getTextContent(m).substring(0, 50))
        .join(' | ')

      for (const fact of facts) {
        await memoryService.storeMemory(
          fact,
          userId,
          guildId,
          conversationSnippet
        )
      }
    } catch (error: any) {
      logger.warn(`Memory extraction failed: ${error.message}`)
    }
  }
}

// Singleton instance
export const aiResponderService = new AiResponderService()
