// @root/src/helpers/aiClient.ts

import { Mistral } from '@mistralai/mistralai'
import Groq from 'groq-sdk'
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
  private mistral: Mistral
  private groq: Groq | null
  private model: string
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

  /** Image-only MIME types for Pixtral vision */
  private static readonly ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ])

  constructor(config: {
    mistralApiKey: string
    groqApiKey?: string
    model: string
    timeout: number
  }) {
    this.mistral = new Mistral({ apiKey: config.mistralApiKey })
    this.groq = config.groqApiKey
      ? new Groq({ apiKey: config.groqApiKey })
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

      // Build user message, optionally with image content for Pixtral vision
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

      // Use pixtral-large-latest for vision requests
      const model = hasImages ? 'pixtral-large-latest' : this.model

      const circuitOpen = this.isCircuitOpen()

      if (!circuitOpen) {
        try {
          const response = await this.callMistral(
            messages,
            model,
            maxTokens,
            temperature,
            tools
          )
          this.recordSuccess()
          return { ...response, latency: Date.now() - startTime }
        } catch (mistralError: any) {
          this.recordFailure()
          if (!this.groq || hasImages) throw mistralError
          Logger.warn(
            `Mistral API failed (${mistralError.message}), falling back to Groq`
          )
        }
      } else if (!this.groq || hasImages) {
        throw new AiCircuitBreakerError()
      } else {
        Logger.warn('Mistral circuit breaker open, using Groq directly')
      }

      // Groq fallback (either circuit was open or Mistral failed)
      try {
        const response = await this.callGroq(
          messages,
          maxTokens,
          temperature,
          tools
        )
        return { ...response, latency: Date.now() - startTime }
      } catch (groqError: any) {
        // If Groq fails because the model hallucinated a bad tool call,
        // retry without tools so the user still gets a text response.
        if (
          groqError?.status === 400 &&
          tools?.length &&
          String(groqError.message).includes('tool_use_failed')
        ) {
          Logger.warn(
            'Groq tool_use_failed, retrying without tools for text-only response'
          )
          const cleaned = this.stripToolMessages(messages)
          const response = await this.callGroq(cleaned, maxTokens, temperature)
          return { ...response, latency: Date.now() - startTime }
        }
        throw groqError
      }
    } catch (error: any) {
      const latency = Date.now() - startTime
      this.handleError(error || new Error('Unknown error'), latency)
      throw error
    }
  }

  /** Remove tool-related messages so a retry without tools won't be rejected. */
  private stripToolMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages
      .filter(m => m.role !== 'tool')
      .map(m => {
        if (m.role === 'assistant' && m.tool_calls) {
          const { tool_calls: _tc, tool_call_id: _id, ...rest } = m
          return rest as ChatMessage
        }
        return m
      })
  }

  /** Map our snake_case ChatMessage[] to the camelCase the Mistral SDK expects */
  private toMistralMessages(
    messages: ChatMessage[]
  ): Record<string, unknown>[] {
    return messages.map(msg => {
      if (msg.role === 'assistant' && msg.tool_calls) {
        const { tool_calls, ...rest } = msg
        return { ...rest, toolCalls: tool_calls }
      }
      if (msg.role === 'tool' && msg.tool_call_id) {
        const { tool_call_id, ...rest } = msg
        return { ...rest, toolCallId: tool_call_id }
      }
      return { ...msg }
    })
  }

  private async callMistral(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    tools?: OpenAITool[]
  ): Promise<Omit<AiResponse, 'latency'>> {
    const response = await this.withRetry(() =>
      this.withTimeout(
        this.mistral.chat.complete({
          model,
          messages: this.toMistralMessages(messages) as any,
          maxTokens,
          temperature,
          tools: tools as any,
        }),
        this.timeout
      )
    )

    const choice = response.choices?.[0]
    const text = (choice?.message?.content as string) ?? ''

    // Mistral uses camelCase: toolCalls
    const rawToolCalls = choice?.message?.toolCalls
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
      tokensUsed: response.usage?.totalTokens ?? 0,
      promptTokens: response.usage?.promptTokens ?? 0,
      completionTokens: response.usage?.completionTokens ?? 0,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
    }
  }

  private async callGroq(
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
    tools?: OpenAITool[]
  ): Promise<Omit<AiResponse, 'latency'>> {
    const response = await this.withRetry(() =>
      this.withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- groq is checked by caller
        this.groq!.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: messages as any,
          max_tokens: maxTokens,
          temperature,
          tools: tools as any,
        }),
        this.timeout
      )
    )

    const choice = response.choices?.[0]
    const text = choice?.message?.content ?? ''

    // Groq uses snake_case: tool_calls
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
