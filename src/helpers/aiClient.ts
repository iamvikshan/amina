// @root/src/helpers/aiClient.ts

import OpenAI from 'openai'
import Logger from './Logger'
import type { MediaItem } from './mediaExtractor'

/** Custom error for circuit breaker open state */
export class AiCircuitBreakerError extends Error {
  constructor() {
    super('AI circuit breaker open -- service temporarily unavailable')
    this.name = 'AiCircuitBreakerError'
  }
}

/** Maximum image size in bytes (10 MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export class AiClient {
  private gemini: OpenAI
  private mistral: OpenAI | null
  private model: string
  private fallbackModel = 'mistral-medium-latest'
  private timeout: number

  /** Retryable HTTP status codes */
  private static readonly RETRYABLE_STATUSES = new Set([429, 500, 502, 503])
  private static readonly MAX_RETRIES = 3
  private static BASE_DELAY_MS = 1000

  // Circuit breaker state
  private static circuitFailures = 0
  private static circuitOpenUntil = 0
  private static readonly CIRCUIT_THRESHOLD = 5
  private static readonly CIRCUIT_RESET_MS = 30_000

  /** Image-only MIME types for vision */
  private static readonly ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ])

  constructor(config: {
    geminiApiKey: string
    mistralApiKey?: string
    model: string
    timeout: number
  }) {
    this.gemini = new OpenAI({
      apiKey: config.geminiApiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    })
    this.mistral = config.mistralApiKey
      ? new OpenAI({
          apiKey: config.mistralApiKey,
          baseURL: 'https://api.mistral.ai/v1',
        })
      : null
    this.model = config.model
    this.timeout = config.timeout
  }

  /** Fetch image data from URL and convert to base64 */
  private async fetchImageAsBase64(url: string): Promise<string> {
    const controller = new AbortController()
    const timerId = setTimeout(() => controller.abort(), this.timeout)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
        throw new Error(
          `Image too large: ${contentLength} bytes (max ${MAX_IMAGE_SIZE})`
        )
      }

      const arrayBuffer = await response.arrayBuffer()
      if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
        throw new Error(
          `Image too large: ${arrayBuffer.byteLength} bytes (max ${MAX_IMAGE_SIZE})`
        )
      }
      return Buffer.from(arrayBuffer).toString('base64')
    } catch (error: any) {
      const safeUrl = (() => {
        try {
          const u = new URL(url)
          return u.origin + u.pathname
        } catch {
          return '<invalid-url>'
        }
      })()
      Logger.error(`Failed to fetch image from ${safeUrl}: ${error.message}`)
      throw error
    } finally {
      clearTimeout(timerId)
    }
  }

  async generateResponse(
    systemPrompt: string,
    conversationHistory: ChatMessage[],
    userMessage: string,
    maxTokens: number,
    temperature: number,
    mediaItems?: MediaItem[],
    tools?: OpenAITool[]
  ): Promise<AiResponse> {
    const startTime = Date.now()

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ]

      // Build user message, optionally with image content for vision
      let hasImages = false
      if (mediaItems && mediaItems.length > 0) {
        const imageContents: any[] = []
        if (userMessage.trim()) {
          imageContents.push({ type: 'text', text: userMessage })
        }
        for (const media of mediaItems) {
          if (!AiClient.ALLOWED_IMAGE_TYPES.has(media.mimeType)) {
            Logger.warn(
              `Unsupported media type for AI vision: ${media.mimeType}, skipping`
            )
            continue
          }
          try {
            const base64 = await this.fetchImageAsBase64(media.url)
            imageContents.push({
              type: 'image_url',
              image_url: {
                url: `data:${media.mimeType};base64,${base64}`,
              },
            })
            hasImages = true
          } catch {
            // Already logged by fetchImageAsBase64
          }
        }
        if (imageContents.length > 0) {
          messages.push({ role: 'user', content: imageContents } as any)
        }
      } else if (userMessage.trim()) {
        messages.push({ role: 'user', content: userMessage })
      }

      const circuitOpen = this.isCircuitOpen()

      if (!circuitOpen) {
        try {
          const response = await this.callGemini(
            messages,
            this.model,
            maxTokens,
            temperature,
            tools
          )
          this.recordSuccess()
          return { ...response, latency: Date.now() - startTime }
        } catch (geminiError: any) {
          this.recordFailure()
          if (!this.mistral || hasImages) throw geminiError
          Logger.warn(
            `Gemini API failed (${geminiError.message}), falling back to Mistral`
          )
        }
      } else if (!this.mistral || hasImages) {
        throw new AiCircuitBreakerError()
      } else {
        Logger.warn('Gemini circuit breaker open, using Mistral directly')
      }

      const response = await this.callMistral(
        messages,
        maxTokens,
        temperature,
        tools
      )
      return { ...response, latency: Date.now() - startTime }
    } catch (error: any) {
      const latency = Date.now() - startTime
      this.handleError(error || new Error('Unknown error'), latency)
      throw error
    }
  }

  /** Parse an OpenAI-compatible chat completion response into our AiResponse shape */
  private parseCompletionResponse(
    response: OpenAI.Chat.Completions.ChatCompletion
  ): Omit<AiResponse, 'latency'> {
    const choice = response.choices?.[0]
    const text = choice?.message?.content ?? ''

    const rawToolCalls = choice?.message?.tool_calls
    const toolCalls: ToolCall[] | undefined = rawToolCalls?.map(tc => ({
      id: tc.id ?? '',
      type: 'function' as const,
      function: {
        name: tc.function?.name ?? '',
        arguments:
          typeof tc.function?.arguments === 'string'
            ? tc.function.arguments
            : JSON.stringify(tc.function?.arguments ?? {}),
      },
    }))

    return {
      text,
      tokensUsed: response.usage?.total_tokens ?? 0,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
    }
  }

  /**
   * Gemini's OpenAI-compatible endpoint does not support multi-turn tool
   * calling (role:'tool' messages or tool_calls on assistant messages cause
   * 400). Convert tool-related turns into plain user/assistant text so the
   * model still sees the context.
   */
  private static sanitizeMessagesForGemini(
    messages: ChatMessage[]
  ): ChatMessage[] {
    const result: ChatMessage[] = []

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]

      if (msg.role === 'assistant' && msg.tool_calls?.length) {
        // Keep assistant text, strip tool_calls
        result.push({
          role: 'assistant',
          content: msg.content || '',
        })

        // Gather consecutive tool-result messages
        const parts: string[] = []
        let j = i + 1
        while (j < messages.length && messages[j].role === 'tool') {
          const t = messages[j]
          parts.push(`[${t.name ?? 'tool'}]: ${t.content}`)
          j++
        }

        if (parts.length > 0) {
          result.push({
            role: 'user',
            content: `[Tool Results]\n${parts.join('\n')}`,
          })
        }

        i = j - 1 // skip processed tool messages
      } else if (msg.role === 'tool') {
        // Orphan tool message – convert to user text
        result.push({
          role: 'user',
          content: `[Tool Result: ${msg.name ?? 'tool'}]: ${msg.content}`,
        })
      } else {
        result.push(msg)
      }
    }

    return result
  }

  private async callGemini(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    tools?: OpenAITool[]
  ): Promise<Omit<AiResponse, 'latency'>> {
    const sanitized = AiClient.sanitizeMessagesForGemini(messages)
    const response = await this.withRetry(() =>
      this.withTimeout(
        this.gemini.chat.completions.create({
          model,
          messages: sanitized as any,
          max_tokens: maxTokens,
          temperature,
          tools: tools as any,
        }),
        this.timeout
      )
    )

    return this.parseCompletionResponse(response)
  }

  private async callMistral(
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
    tools?: OpenAITool[]
  ): Promise<Omit<AiResponse, 'latency'>> {
    const response = await this.withRetry(() =>
      this.withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- mistral is checked by caller
        this.mistral!.chat.completions.create({
          model: this.fallbackModel,
          messages: messages as any,
          max_tokens: maxTokens,
          temperature,
          tools: tools as any,
        }),
        this.timeout
      )
    )

    return this.parseCompletionResponse(response)
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any
    for (let attempt = 0; attempt <= AiClient.MAX_RETRIES; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error
        const status = error?.status ?? error?.httpStatusCode
        if (
          attempt < AiClient.MAX_RETRIES &&
          (AiClient.RETRYABLE_STATUSES.has(status) ||
            error?.message === 'API timeout')
        ) {
          const delay =
            AiClient.BASE_DELAY_MS *
            Math.pow(2, attempt) *
            (0.5 + Math.random() * 0.5)
          Logger.warn(
            `AI API retry ${attempt + 1}/${AiClient.MAX_RETRIES} after ${Math.round(delay)}ms (status: ${status ?? 'timeout'})`
          )
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        throw error
      }
    }
    throw lastError
  }

  private isCircuitOpen(): boolean {
    if (AiClient.circuitFailures >= AiClient.CIRCUIT_THRESHOLD) {
      if (Date.now() < AiClient.circuitOpenUntil) return true
      AiClient.circuitFailures = 0
    }
    return false
  }

  private recordSuccess(): void {
    AiClient.circuitFailures = 0
  }

  private recordFailure(): void {
    AiClient.circuitFailures++
    if (AiClient.circuitFailures === AiClient.CIRCUIT_THRESHOLD) {
      AiClient.circuitOpenUntil = Date.now() + AiClient.CIRCUIT_RESET_MS
      Logger.error(
        `AI circuit breaker OPEN after ${AiClient.circuitFailures} failures (reset in ${AiClient.CIRCUIT_RESET_MS / 1000}s)`
      )
    }
  }

  /** @internal For testing only */
  static resetCircuit(): void {
    AiClient.circuitFailures = 0
    AiClient.circuitOpenUntil = 0
  }

  /** @internal For testing only */
  static setRetryDelay(ms: number): void {
    AiClient.BASE_DELAY_MS = ms
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timerId: ReturnType<typeof setTimeout> | undefined
    return Promise.race([
      promise.finally(() => {
        if (timerId) clearTimeout(timerId)
      }),
      new Promise<T>((_, reject) => {
        timerId = setTimeout(() => reject(new Error('API timeout')), timeoutMs)
      }),
    ])
  }

  private handleError(error: any, latency: number) {
    if (!error) {
      Logger.error('Unknown error occurred')
      return
    }

    const errorMessage = error.message || 'Unknown error'
    const errorStatus = error.status

    if (errorMessage === 'API timeout') {
      Logger.error(`AI API timeout after ${latency}ms`)
      return
    }

    if (errorStatus === 429 || errorMessage.includes('quota')) {
      Logger.error(`AI API quota exceeded: ${errorMessage}`)
      return
    }

    if (errorStatus === 400) {
      Logger.error(`AI API invalid request: ${errorMessage}`)
      return
    }

    try {
      Logger.error(
        `Unhandled AI error - Type: ${typeof error}, Message: ${errorMessage}`
      )
      if (error.stack) Logger.debug(`Stack: ${error.stack}`)
    } catch (_logError) {
      Logger.error('Failed to log AI error details')
    }
  }
}
