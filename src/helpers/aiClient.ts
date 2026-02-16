// @root/src/helpers/aiClient.ts

import { GoogleGenAI, type GoogleGenAIOptions } from '@google/genai'
import type { JWTInput } from 'google-auth-library'
import Logger from './Logger'
import type { MediaItem } from './mediaExtractor'

// AiResponse and ConversationMessage are now globally available - see types/services.d.ts
// These are still exported for runtime use, but types are global
export type { AiResponse, ConversationMessage }

/** Maximum image size in bytes (10 MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export class AiClient {
  private ai: GoogleGenAI
  private model: string
  private timeout: number
  private authMode: 'api-key' | 'vertex'

  /** Retryable HTTP status codes */
  private static readonly RETRYABLE_STATUSES = new Set([429, 500, 502, 503])
  private static readonly MAX_RETRIES = 3
  private static BASE_DELAY_MS = 1000

  // Circuit breaker state
  private static circuitFailures = 0
  private static circuitOpenUntil = 0
  private static readonly CIRCUIT_THRESHOLD = 5 // failures before opening
  private static readonly CIRCUIT_RESET_MS = 30_000 // 30s open period

  /** Allowed media MIME types for Gemini */
  private static readonly ALLOWED_MEDIA_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ])

  constructor(authConfig: AiAuthConfig, model: string, timeout: number) {
    if (authConfig.mode === 'vertex') {
      const options: GoogleGenAIOptions = {
        vertexai: true,
        project: authConfig.project,
        location: authConfig.location,
      }
      if (authConfig.credentials) {
        options.googleAuthOptions = {
          credentials: authConfig.credentials as JWTInput,
        }
      }
      this.ai = new GoogleGenAI(options)
      this.authMode = 'vertex'
    } else {
      this.ai = new GoogleGenAI({ apiKey: authConfig.apiKey })
      this.authMode = 'api-key'
    }
    this.model = model
    this.timeout = timeout
  }

  /** Get the current auth mode */
  getAuthMode(): 'api-key' | 'vertex' {
    return this.authMode
  }

  /**
   * Fetch image data from URL and convert to base64
   */
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
      Logger.warn(`Failed to fetch image from ${safeUrl}: ${error.message}`)
      throw error
    } finally {
      clearTimeout(timerId)
    }
  }

  /**
   * Convert media items to Gemini API format
   */
  private async convertMediaToParts(
    mediaItems: MediaItem[]
  ): Promise<ContentPart[]> {
    const tasks = mediaItems.map(async (media): Promise<ContentPart | null> => {
      try {
        const base64Data = await this.fetchImageAsBase64(media.url)

        let mimeType = media.mimeType
        if (!mimeType) {
          let ext = ''
          try {
            ext = new URL(media.url, 'http://localhost').pathname.toLowerCase()
          } catch {
            ext = media.url.toLowerCase()
          }
          if (ext.endsWith('.png')) {
            mimeType = 'image/png'
          } else if (ext.endsWith('.gif')) {
            mimeType = 'image/gif'
          } else if (ext.endsWith('.webp')) {
            mimeType = 'image/webp'
          } else {
            mimeType = 'image/jpeg'
          }
        }

        if (!AiClient.ALLOWED_MEDIA_TYPES.has(mimeType)) {
          Logger.warn(`Unsupported media type: ${mimeType}, skipping`)
          return null
        }

        return { inlineData: { data: base64Data, mimeType } }
      } catch (_error: any) {
        // Error already logged by fetchImageAsBase64
        return null
      }
    })

    const results = await Promise.all(tasks)
    return results.filter((part): part is ContentPart => part !== null)
  }

  async generateResponse(
    systemPrompt: string,
    conversationHistory: globalThis.ConversationMessage[],
    userMessage: string,
    maxTokens: number,
    temperature: number,
    mediaItems?: MediaItem[],
    tools?: any[]
  ): Promise<globalThis.AiResponse> {
    const startTime = Date.now()

    try {
      this.checkCircuit()

      // Build contents array from history + current message
      const contents: ConversationMessage[] = [...conversationHistory]

      // Build current user message parts
      const userParts: ContentPart[] = []
      if (userMessage.trim()) {
        userParts.push({ text: userMessage })
      }
      if (mediaItems && mediaItems.length > 0) {
        const mediaParts = await this.convertMediaToParts(mediaItems)
        userParts.push(...mediaParts)
      }
      // Only add user message if there are actual parts to send (avoids 400 errors from empty parts[])
      if (userParts.length > 0) {
        contents.push({ role: 'user', parts: userParts })
      }

      // Call generateContent
      const response = await this.withRetry(() =>
        this.withTimeout(
          this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
              systemInstruction: systemPrompt,
              maxOutputTokens: maxTokens,
              temperature,
              tools: tools ? [{ functionDeclarations: tools }] : undefined,
            },
          }),
          this.timeout
        )
      )

      this.recordSuccess()

      const text = response.text ?? ''
      const functionCalls = response.functionCalls
      const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0
      const promptTokens = response.usageMetadata?.promptTokenCount ?? 0
      const completionTokens = response.usageMetadata?.candidatesTokenCount ?? 0
      const latency = Date.now() - startTime

      // We always use the first candidate (single-candidate mode)
      const rawParts = response.candidates?.[0]?.content?.parts
      const modelContent: ContentPart[] | undefined = rawParts
        ? rawParts.filter(
            (p): p is ContentPart =>
              typeof p === 'object' &&
              p !== null &&
              ('text' in p ||
                'inlineData' in p ||
                'functionCall' in p ||
                'functionResponse' in p)
          )
        : undefined

      return {
        text,
        tokensUsed,
        promptTokens,
        completionTokens,
        latency,
        functionCalls: functionCalls?.map(fc => {
          if (!fc.name) {
            Logger.warn(
              `Function call received without name, using 'unknown'. Full call: ${JSON.stringify(fc)}`
            )
          }
          return { name: fc.name ?? 'unknown', args: fc.args ?? {} }
        }),
        modelContent: modelContent ?? (text ? [{ text }] : undefined),
      }
    } catch (error: any) {
      // Don't count circuit breaker errors as new failures
      if (
        error?.message !==
        'AI circuit breaker open \u2014 service temporarily unavailable'
      ) {
        this.recordFailure()
      }
      const latency = Date.now() - startTime
      this.handleError(error || new Error('Unknown error'), latency)
      throw error
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

  private checkCircuit(): void {
    if (
      AiClient.circuitFailures >= AiClient.CIRCUIT_THRESHOLD &&
      Date.now() < AiClient.circuitOpenUntil
    ) {
      throw new Error(
        'AI circuit breaker open — service temporarily unavailable'
      )
    }
    // Reset if we're past the open window
    if (
      Date.now() >= AiClient.circuitOpenUntil &&
      AiClient.circuitFailures >= AiClient.CIRCUIT_THRESHOLD
    ) {
      AiClient.circuitFailures = 0
    }
  }

  private recordSuccess(): void {
    AiClient.circuitFailures = 0
  }

  private recordFailure(): void {
    AiClient.circuitFailures++
    // Only set the open window on the exact transition to OPEN
    if (AiClient.circuitFailures === AiClient.CIRCUIT_THRESHOLD) {
      AiClient.circuitOpenUntil = Date.now() + AiClient.CIRCUIT_RESET_MS
      Logger.warn(
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
      Logger.warn(`AI API timeout after ${latency}ms`)
      return
    }

    if (errorStatus === 429 || errorMessage.includes('quota')) {
      Logger.warn(`AI API quota exceeded: ${errorMessage}`)
      return
    }

    if (errorStatus === 400) {
      Logger.warn(`AI API invalid request: ${errorMessage}`)
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
