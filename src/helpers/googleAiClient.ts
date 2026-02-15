// @root/src/helpers/googleAiClient.ts

import { GoogleGenAI } from '@google/genai'
import Logger from './Logger'
import type { MediaItem } from './mediaExtractor'

const logger = Logger

// AiResponse and ConversationMessage are now globally available - see types/services.d.ts
// These are still exported for runtime use, but types are global
export type { AiResponse, ConversationMessage }

export class GoogleAiClient {
  private ai: GoogleGenAI
  private model: string
  private timeout: number

  constructor(apiKey: string, model: string, timeout: number) {
    this.ai = new GoogleGenAI({ apiKey })
    this.model = model
    this.timeout = timeout
  }

  /**
   * Fetch image data from URL and convert to base64
   */
  private async fetchImageAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      return base64
    } catch (error: any) {
      logger.warn(`Failed to fetch image from ${url}: ${error.message}`)
      throw error
    }
  }

  /**
   * Convert media items to Gemini API format
   */
  private async convertMediaToParts(
    mediaItems: MediaItem[]
  ): Promise<ContentPart[]> {
    const parts: ContentPart[] = []

    for (const media of mediaItems) {
      try {
        // Fetch and convert to base64
        const base64Data = await this.fetchImageAsBase64(media.url)

        // Determine MIME type
        let mimeType = media.mimeType
        if (!mimeType || mimeType === 'image/jpeg') {
          // Try to infer from URL
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

        parts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to process media ${media.url}: ${error.message}`)
        // Continue with other media items
      }
    }

    return parts
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
            logger.warn(
              `Function call received without name, using 'unknown'. Full call: ${JSON.stringify(fc)}`
            )
          }
          return { name: fc.name ?? 'unknown', args: fc.args }
        }),
        modelContent: modelContent ?? (text ? [{ text }] : undefined),
      }
    } catch (error: any) {
      const latency = Date.now() - startTime
      const errorMessage = error?.message || String(error)
      logger.error(`AI API error in generateResponse: ${errorMessage}`, error)
      logger.debug(
        `Error details: ${JSON.stringify({ status: error?.status, name: error?.name, message: error?.message })}`
      )
      this.handleError(error || new Error('Unknown error'), latency)
      throw error
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), timeoutMs)
      ),
    ])
  }

  private handleError(error: any, latency: number) {
    if (!error) {
      logger.error('Unknown error occurred')
      return
    }

    const errorMessage = error.message || 'Unknown error'
    const errorStatus = error.status

    if (errorMessage === 'API timeout') {
      logger.warn(`AI API timeout after ${latency}ms`)
      return
    }

    if (errorStatus === 429 || errorMessage.includes('quota')) {
      logger.warn(`AI API quota exceeded: ${errorMessage}`)
      return
    }

    if (errorStatus === 400) {
      logger.warn(`AI API invalid request: ${errorMessage}`)
      return
    }

    try {
      logger.error(
        `Unhandled AI error - Type: ${typeof error}, Message: ${errorMessage}`
      )
      if (error.stack) logger.debug(`Stack: ${error.stack}`)
    } catch (_logError) {
      logger.error('Failed to log AI error details')
    }
  }
}
