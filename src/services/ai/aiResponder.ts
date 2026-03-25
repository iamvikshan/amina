// @root/src/services/ai/aiResponder.ts

import type { GuildMember, Message } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { getUser } from '@schemas/User'
import { AiClient } from '@helpers/aiClient'
import {
  conversationBuffer,
  ConversationBuffer,
  type Message as BufferMessage,
} from '@structures/conversationBuffer'
import { memoryService } from './memoryService'
import Logger from '@helpers/Logger'
import { config, configCache } from '../../config'
import {
  extractMediaFromMessage,
  type MediaItem,
} from '@helpers/mediaExtractor'
import { aiCommandRegistry } from './aiCommandRegistry'
import { VirtualInteraction } from '@structures/VirtualInteraction'
import aiPermissions from '@data/aiPermissions.json'
import { mina } from '@helpers/mina'
import { getToolStatusCategory } from '@helpers/toolStatus'
import { aiMetrics } from './aiMetrics'
import { LRUCache } from 'lru-cache'
import { checkInjection } from '@helpers/injectionDetector'

const logger = Logger

export const MEMORY_TOOLS = new Set([
  'remember_fact',
  'update_memory',
  'forget_memory',
  'recall_memories',
])

// ResponseMode and RateLimitEntry are now globally available - see types/services.d.ts

export class AiResponderService {
  private client: AiClient | null = null
  private rateLimits = new LRUCache<string, RateLimitEntry>({
    max: 10_000,
    ttl: 60_000,
  })
  private failureCount = new LRUCache<string, number[]>({ max: 5_000 })
  private readonly USER_COOLDOWN_MS = 3000 // 3 seconds per user
  private readonly CHANNEL_COOLDOWN_MS = 1000 // 1 second per channel in free-will
  private readonly FAILURE_THRESHOLD = 5
  private readonly FAILURE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
  // Track current client config to avoid unnecessary recreation
  private currentClientConfig: {
    model: string
    extractionModel: string
    timeoutMs: number
    authConfig: string // serialized for comparison
  } | null = null

  /**
   * Check if a guild is the test guild
   * @param guildId
   */
  private isTestGuild(guildId: string | null): boolean {
    if (!guildId) return false
    return guildId === config.BOT.TEST_GUILD_ID
  }

  /**
   * Get free-will channels from guild settings
   * @param guildSettings
   */
  private getFreeWillChannels(guildSettings: any): string[] {
    if (!guildSettings?.aiResponder) return []
    return guildSettings.aiResponder.freeWillChannels || []
  }

  /**
   * Check if a message is a reply to the bot
   * Fetches the referenced message and verifies it's from the bot
   * @param message
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

      if (config.globallyEnabled) {
        if (!config.geminiApiKey) {
          logger.error('AI globally enabled but GEMINI API key is empty')
          this.client = null
          this.currentClientConfig = null
          return
        }

        const authFingerprint = Bun.hash(config.geminiApiKey)
          .toString(16)
          .slice(0, 8)
        const mistralFingerprint = config.mistralApiKey
          ? Bun.hash(config.mistralApiKey).toString(16).slice(0, 8)
          : ''
        const configKey = `gemini:${authFingerprint}${mistralFingerprint ? `:mistral:${mistralFingerprint}` : ''}`

        const needsClientRecreation =
          !this.currentClientConfig ||
          this.currentClientConfig.model !== config.model ||
          this.currentClientConfig.extractionModel !== config.extractionModel ||
          this.currentClientConfig.timeoutMs !== config.timeoutMs ||
          this.currentClientConfig.authConfig !== configKey

        if (needsClientRecreation) {
          this.client = new AiClient({
            geminiApiKey: config.geminiApiKey,
            mistralApiKey: config.mistralApiKey,
            model: config.model,
            extractionModel: config.extractionModel,
            timeout: config.timeoutMs,
          })
          this.currentClientConfig = {
            model: config.model,
            extractionModel: config.extractionModel,
            timeoutMs: config.timeoutMs,
            authConfig: configKey,
          }
          logger.success(`AI Responder initialized`)
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
      this.client = null
      this.currentClientConfig = null
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
      // Rate limiting
      if (this.isRateLimited(message, mode)) {
        logger.debug(
          `Message rate limited - User: ${message.author.id}, Channel: ${message.channel.id}`
        )
        return
      }

      // Show helpful tip about free will channels when user @mentions in a non-free-will channel
      if (message.guild && mode === 'mention') {
        const guildSettings = await getSettings(message.guild)
        const freeWillChannels = this.getFreeWillChannels(guildSettings)

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

      // Show typing indicator
      if ('sendTyping' in message.channel) {
        await message.channel.sendTyping()
      }

      // Build conversation context
      const conversationId = this.getConversationId(message)

      // Get history BEFORE appending current message
      let history = await conversationBuffer.getHistory(conversationId)

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
        logger.error('No AI client available for response')
        return
      }

      // Format history with speaker attribution for AI
      const formattedHistory = this.formatHistoryForAI(history)

      // Get tools from registry
      const tools = aiCommandRegistry.getTools()

      // Check for injection attempts
      const injectionCheck = checkInjection(message.content || '')
      if (injectionCheck.detected) {
        logger.error(
          `Injection attempt detected from ${message.author.id}: ${injectionCheck.patterns.join(', ')}`
        )
        // Don't block — just log for now. The system prompt should be robust enough.
        // Could add rate limiting or blocking for repeat offenders in the future.
      }

      // Build tool descriptions for extraction
      const toolDescriptions = tools
        .map(t => {
          const params = t.function.parameters?.properties
            ? Object.entries(t.function.parameters.properties)
                .map(
                  ([k, v]: [string, any]) =>
                    `${k}: ${v.type}${v.description ? ' - ' + v.description : ''}`
                )
                .join(', ')
            : 'none'
          return `- ${t.function.name}: ${t.function.description} (params: ${params})`
        })
        .join('\n')

      // Call 1 - Extraction: intent, tools, memories, status
      const extractionUserMessage = hasMediaContent
        ? `${message.content || ''} [User attached ${mediaItems.length} image(s)]`
        : message.content || ''

      let extraction: ExtractionResult
      try {
        extraction = await this.client.extractAnalysis(
          enhancedPrompt,
          formattedHistory,
          extractionUserMessage,
          toolDescriptions
        )
      } catch (err: any) {
        logger.warn(
          `Extraction failed (${err.message}), falling back to ReAct loop`
        )
        return this._reactFallback(
          message,
          enhancedPrompt,
          formattedHistory,
          config,
          mediaItems,
          conversationId
        )
      }

      let totalToolCalls = 0
      let statusMessage: Message | null = null
      const statusText = extraction.statusText?.trim()
      const executedToolNames = new Set<string>()

      // Execute tools from extraction result
      const toolResults: string[] = []
      const historyWithCurrentUser = this.appendCurrentUserMessage(
        formattedHistory,
        message.content || ''
      )

      for (const toolSpec of extraction.tools) {
        const commandName = toolSpec.name
        let args = this.getValidExtractionArgs(commandName, toolSpec.args)
        if (!args) continue

        // Check if native tool
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
              toolResults.push(permissionCheck.reason)
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
            totalToolCalls++
            executedToolNames.add(commandName)
            toolResults.push(toolResult)
          } catch (err: any) {
            logger.error(
              `Failed to execute native tool ${commandName}: ${err.message}`
            )
            toolResults.push(`Tool ${commandName} failed: ${err.message}`)
          }
          continue
        }

        // Resolve compound name
        const resolved = aiCommandRegistry.resolveToolName(commandName)
        const realCommandName = resolved?.commandName ?? commandName
        if (resolved?.subcommand) args.subcommand = resolved.subcommand
        if (resolved?.subcommandGroup)
          args.subcommandGroup = resolved.subcommandGroup

        const command = aiCommandRegistry.getCommand(commandName)
        const metadata = aiCommandRegistry.getMetadata(commandName)

        if (!command || !metadata) {
          toolResults.push(
            `Command /${realCommandName} not found. Available commands may be limited.`
          )
          continue
        }

        const permissionCheck = await this.checkCommandPermissions(
          message,
          realCommandName,
          metadata,
          args
        )

        if (!permissionCheck.allowed) {
          toolResults.push(permissionCheck.reason)
          continue
        }

        if (permissionCheck.isFreeWill) {
          args = this.applyFreeWillLimits(realCommandName, args)
        }

        const virtualInteraction = new VirtualInteraction(
          message.client,
          message,
          realCommandName,
          args
        )

        try {
          await command.interactionRun(virtualInteraction as any, {
            settings: message.guild
              ? await getSettings(message.guild)
              : undefined,
          })

          const output = virtualInteraction.getOutput()
          const resultText = output
            ? `Command /${commandName} executed successfully. Result:\n${output}`
            : `Command /${commandName} executed successfully (no text output).`

          totalToolCalls++
          executedToolNames.add(commandName)
          toolResults.push(resultText)
        } catch (err: any) {
          logger.error(
            `Failed to execute AI command ${commandName}: ${err.message}`
          )
          toolResults.push(
            `Command /${commandName} failed with error: ${err.message}`
          )
        }
      }

      // Skip status message when only memory tools executed
      const hasNonMemoryTools = [...executedToolNames].some(
        name => !MEMORY_TOOLS.has(name)
      )
      if (hasNonMemoryTools && statusText && statusText.length > 1) {
        try {
          statusMessage = await message.reply(statusText)
        } catch {
          // If status message fails to send, continue without it
        }
      }

      // Store extracted memories (fire-and-forget)
      const memoriesCreated = this.storeExtractedMemories(
        extraction.memories,
        message,
        historyWithCurrentUser
      )

      // Build synthetic history for Call 2
      const updatedHistory: ChatMessage[] = [...historyWithCurrentUser]

      // Only inject tool results into history when tools were actually used
      if (toolResults.length > 0) {
        const toolSummary = `Used tools: ${extraction.tools.map(t => t.name).join(', ')}. Results:\n${toolResults.join('\n')}`
        const syntheticMessage = `[INTERNAL CONTEXT - do not narrate or repeat this to the user] [Intent: ${extraction.intent}] ${toolSummary}`
        conversationBuffer.appendAssistantMessage(
          conversationId,
          syntheticMessage
        )
        updatedHistory.push({ role: 'assistant', content: syntheticMessage })
      }

      // Show typing indicator before Call 2
      if (!statusMessage && 'sendTyping' in message.channel) {
        await message.channel.sendTyping()
      }

      // Call 2 - Response: generate final reply (no tools)
      const result = await this.client.generateResponse(
        enhancedPrompt,
        updatedHistory,
        '',
        config.maxTokens,
        config.temperature,
        hasMediaContent ? mediaItems : undefined,
        undefined
      )

      // Send final text reply
      if (result.text && result.text.trim()) {
        if (statusMessage) {
          try {
            await statusMessage.edit(result.text)
          } catch {
            await message.reply(result.text)
          }
        } else {
          await message.reply(result.text)
        }
        conversationBuffer.appendAssistantMessage(conversationId, result.text)
      } else if (statusMessage) {
        try {
          await statusMessage.delete()
        } catch {
          // Ignore if already deleted
        }
      }

      // Record AI metrics
      aiMetrics.record({
        userId: message.author.id,
        guildId: message.guild?.id ?? null,
        tokensUsed: result.tokensUsed,
        toolCalls: totalToolCalls,
        memoriesCreated,
      })

      // Clear failure count on success
      if (message.guild) {
        this.clearFailures(message.guild.id)
      }
    } catch (error: any) {
      logger.error(
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
   * @param message
   * @param commandName
   * @param metadata
   * @param metadata.permissionModel
   * @param metadata.userPermissions
   * @param metadata.freeWillAllowed
   * @param args
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
   * @param content
   */
  private detectPromptInjection(content: string): boolean {
    const lower = content.toLowerCase()
    return aiPermissions.injectionPatterns.some(pattern =>
      lower.includes(pattern.toLowerCase())
    )
  }

  /**
   * Check if user message likely contains explicit request for this command
   * @param content
   * @param commandName
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
      bank: ['bank', 'transfer', 'deposit', 'withdraw', 'send coins'],
      stop: ['stop', 'stop playing', 'end music'],
      leave: ['leave', 'disconnect', 'leave vc', 'leave voice'],
      report: ['report', 'bug report', 'feedback'],
      tictactoe: ['tictactoe', 'tic tac toe'],
    }

    // Check command name directly
    if (lower.includes(commandName)) return true

    // Check action words for this command
    const words = actionWords[commandName] || []
    return words.some(word => lower.includes(word))
  }

  /**
   * Check if target user has higher/equal role than bot (for free will actions)
   * @param message
   * @param args
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
   * @param commandName
   * @param args
   */
  private applyFreeWillLimits(
    commandName: string,
    args: Record<string, any>
  ): Record<string, any> {
    const limits = aiPermissions.freeWill.limits as Record<
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
   * @param history
   */
  private formatHistoryForAI(history: BufferMessage[]): ChatMessage[] {
    const sanitized = ConversationBuffer.sanitizeToolPairs(history)
    return sanitized.map(msg => ConversationBuffer.formatWithAttribution(msg))
  }

  private appendCurrentUserMessage(
    history: ChatMessage[],
    userMessage: string
  ): ChatMessage[] {
    if (!userMessage.trim()) return [...history]
    return [...history, { role: 'user', content: userMessage }]
  }

  private buildConversationSnippet(history: ChatMessage[]): string {
    return history
      .slice(-3)
      .map(message =>
        (typeof message.content === 'string' ? message.content : '').substring(
          0,
          50
        )
      )
      .join(' | ')
  }

  private getValidExtractionArgs(
    commandName: string,
    rawArgs: unknown
  ): Record<string, any> | null {
    if (!this.isPlainObject(rawArgs)) {
      logger.error(
        `Invalid extraction tool arguments for ${commandName}: expected plain object, got ${this.describeValueType(rawArgs)}`
      )
      return null
    }

    return { ...rawArgs }
  }

  private isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  private describeValueType(value: unknown): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  private storeExtractedMemories(
    memories: MemoryFact[],
    message: Message,
    history: ChatMessage[]
  ): number {
    if (memories.length === 0) return 0

    const conversationSnippet = this.buildConversationSnippet(history)

    for (const fact of memories) {
      memoryService
        .storeMemory(
          fact,
          message.author.id,
          message.guild?.id || null,
          conversationSnippet
        )
        .catch(err => logger.error(`Failed to store memory: ${err.message}`))
    }

    return memories.length
  }

  private async extractFallbackMemories(
    message: Message,
    enhancedPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<MemoryFact[]> {
    if (!this.client || !userMessage.trim()) return []

    try {
      const extraction = await this.client.extractAnalysis(
        enhancedPrompt,
        history,
        userMessage,
        ''
      )
      return extraction.memories
    } catch (error: any) {
      logger.warn(
        `Fallback memory extraction failed for ${message.author.id}: ${error.message}`
      )
      return []
    }
  }

  /**
   * Get active participants using hybrid approach:
   * - Users from last N messages (conversation thread context)
   * - Users who spoke within time window (recent activity)
   * This handles both active conversations and prevents stale participants
   * @param history
   * @param currentUserId
   * @param timeWindowMs
   * @param maxMessageLookback
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
   * @param userIds
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
        logger.error(
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

  /**
   * ReAct loop fallback when the 2-call extraction pipeline fails.
   * Contains the full original multi-iteration tool-calling flow.
   * @param message
   * @param enhancedPrompt
   * @param formattedHistory
   * @param config
   * @param mediaItems
   * @param conversationId
   */
  private async _reactFallback(
    message: Message,
    enhancedPrompt: string,
    formattedHistory: ChatMessage[],
    config: AiConfig,
    mediaItems: MediaItem[],
    conversationId: string
  ): Promise<void> {
    const hasMediaContent = mediaItems.length > 0
    const tools = aiCommandRegistry.getTools()

    if (!this.client) throw new Error('AI client unavailable')

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

    let totalTokensUsed = result.tokensUsed
    let totalToolCalls = 0
    const reactExecutedToolNames = new Set<string>()

    const MAX_ITERATIONS = 5
    let iteration = 0
    let currentHistory = [...formattedHistory]
    let statusMessage: Message | null = null

    if (message.content && message.content.trim()) {
      currentHistory.push({ role: 'user', content: message.content })
    }

    while (iteration < MAX_ITERATIONS) {
      const toolCalls = result.toolCalls ?? []
      if (toolCalls.length === 0) break
      iteration++

      const functionResults: string[] = []

      for (const call of toolCalls) {
        const commandName = call.function.name
        let args: Record<string, any>
        try {
          const parsed =
            typeof call.function.arguments === 'string'
              ? JSON.parse(call.function.arguments)
              : call.function.arguments
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new TypeError(`Expected object, got ${typeof parsed}`)
          }
          args = parsed
        } catch (parseError) {
          Logger.error(
            `Failed to parse tool arguments for ${commandName}`,
            parseError
          )
          functionResults.push(`Error: invalid arguments for ${commandName}`)
          continue
        }

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
            totalToolCalls++
            reactExecutedToolNames.add(commandName)
            functionResults.push(toolResult)
          } catch (err: any) {
            logger.error(
              `Failed to execute native tool ${commandName}: ${err.message}`
            )
            functionResults.push(`Tool ${commandName} failed: ${err.message}`)
          }
          continue
        }

        const resolved = aiCommandRegistry.resolveToolName(commandName)
        const realCommandName = resolved?.commandName ?? commandName
        if (resolved?.subcommand) args.subcommand = resolved.subcommand
        if (resolved?.subcommandGroup)
          args.subcommandGroup = resolved.subcommandGroup

        const command = aiCommandRegistry.getCommand(commandName)
        const metadata = aiCommandRegistry.getMetadata(commandName)

        if (!command || !metadata) {
          functionResults.push(
            `Command /${realCommandName} not found. Available commands may be limited.`
          )
          continue
        }

        const permissionCheck = await this.checkCommandPermissions(
          message,
          realCommandName,
          metadata,
          args
        )

        if (!permissionCheck.allowed) {
          functionResults.push(permissionCheck.reason)
          continue
        }

        if (permissionCheck.isFreeWill) {
          args = this.applyFreeWillLimits(realCommandName, args)
        }

        const virtualInteraction = new VirtualInteraction(
          message.client,
          message,
          realCommandName,
          args
        )

        try {
          await command.interactionRun(virtualInteraction as any, {
            settings: message.guild
              ? await getSettings(message.guild)
              : undefined,
          })

          const output = virtualInteraction.getOutput()
          const resultText = output
            ? `Command /${commandName} executed successfully. Result:\n${output}`
            : `Command /${commandName} executed successfully (no text output).`

          totalToolCalls++
          reactExecutedToolNames.add(commandName)
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

      // Skip status message when only memory tools executed
      const hasNonMemoryReactTools = [...reactExecutedToolNames].some(
        name => !MEMORY_TOOLS.has(name)
      )
      if (hasNonMemoryReactTools && !statusMessage) {
        const toolNames = toolCalls.map(tc => tc.function.name)
        const category = getToolStatusCategory(toolNames)
        const statusText = mina.say(category)
        try {
          statusMessage = await message.reply(statusText)
        } catch {
          // If status message fails to send, continue without it
        }
      }

      conversationBuffer.appendAssistantMessage(
        conversationId,
        result.text || '',
        toolCalls
      )
      currentHistory.push({
        role: 'assistant',
        content: result.text || '',
        tool_calls: toolCalls,
      })

      for (let i = 0; i < toolCalls.length; i++) {
        const call = toolCalls[i]
        const toolResult = functionResults[i] || 'No result'
        conversationBuffer.appendToolResult(
          conversationId,
          call.id,
          call.function.name,
          toolResult
        )
        currentHistory.push({
          role: 'tool',
          content: toolResult,
          tool_call_id: call.id,
          name: call.function.name,
        })
      }

      if (!statusMessage && 'sendTyping' in message.channel) {
        await message.channel.sendTyping()
      }

      result = await this.client.generateResponse(
        enhancedPrompt,
        currentHistory,
        '',
        config.maxTokens,
        config.temperature,
        undefined,
        tools
      )

      totalTokensUsed += result.tokensUsed
    }

    const fallbackUserMessage =
      message.content ||
      (hasMediaContent ? 'What do you see in this image?' : '')
    const fallbackMemories = await this.extractFallbackMemories(
      message,
      enhancedPrompt,
      formattedHistory,
      fallbackUserMessage
    )

    let memoryHistory = [...currentHistory]

    if (result.text && result.text.trim()) {
      if (statusMessage) {
        try {
          await statusMessage.edit(result.text)
        } catch {
          await message.reply(result.text)
        }
      } else {
        await message.reply(result.text)
      }
      conversationBuffer.appendAssistantMessage(
        conversationId,
        result.text,
        result.toolCalls
      )
      memoryHistory = [
        ...memoryHistory,
        { role: 'assistant', content: result.text },
      ]
    } else if (statusMessage) {
      try {
        await statusMessage.delete()
      } catch {
        // Ignore if already deleted
      }
    }

    if (iteration >= MAX_ITERATIONS) {
      logger.error(
        `ReAct loop hit max iterations (${MAX_ITERATIONS}) for message ${message.id}`
      )
    }

    const memoriesCreated = this.storeExtractedMemories(
      fallbackMemories,
      message,
      memoryHistory
    )

    aiMetrics.record({
      userId: message.author.id,
      guildId: message.guild?.id ?? null,
      tokensUsed: totalTokensUsed,
      toolCalls: totalToolCalls,
      memoriesCreated,
    })

    if (message.guild) {
      this.clearFailures(message.guild.id)
    }
  }
}

// Singleton instance
export const aiResponderService = new AiResponderService()
