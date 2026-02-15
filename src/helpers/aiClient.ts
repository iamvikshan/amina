// @root/src/helpers/aiClient.ts

import { GoogleGenAI, type GoogleGenAIOptions } from '@google/genai'
import type { JWTInput } from 'google-auth-library'
import Logger from './Logger'
import type { MediaItem } from './mediaExtractor'

// AiResponse and ConversationMessage are now globally available - see types/services.d.ts
// These are still exported for runtime use, but types are global
export type { AiResponse, ConversationMessage }

export class AiClient {
  private ai: GoogleGenAI
  private model: string
  private timeout: number
  private authMode: 'api-key' | 'vertex'

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
      const arrayBuffer = await response.arrayBuffer()
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
          if (media.url.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png'
          } else if (media.url.toLowerCase().endsWith('.gif')) {
            mimeType = 'image/gif'
          } else if (media.url.toLowerCase().endsWith('.webp')) {
            mimeType = 'image/webp'
          } else {
            mimeType = 'image/jpeg'
          }
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
      const response = await this.withTimeout(
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

      const text = response.text ?? ''
      const functionCalls = response.functionCalls
      const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0
      const latency = Date.now() - startTime

      // We always use the first candidate (single-candidate mode)
      const modelContent = response.candidates?.[0]?.content?.parts as
        | ContentPart[]
        | undefined

      return {
        text,
        tokensUsed,
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
      const latency = Date.now() - startTime
      this.handleError(error || new Error('Unknown error'), latency)
      throw error
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timerId: ReturnType<typeof setTimeout>
    return Promise.race([
      promise.finally(() => clearTimeout(timerId)),
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
