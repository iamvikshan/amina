// @root/src/helpers/googleAiClient.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import Logger from './Logger'
import type { MediaItem } from './mediaExtractor'

const logger = Logger

// AiResponse and ConversationMessage are now globally available - see types/services.d.ts
// These are still exported for runtime use, but types are global
export type { AiResponse, ConversationMessage }

export class GoogleAiClient {
  private genAI: GoogleGenerativeAI
  private model: string
  private timeout: number

  constructor(apiKey: string, model: string, timeout: number) {
    this.genAI = new GoogleGenerativeAI(apiKey)
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
  private async convertMediaToParts(mediaItems: MediaItem[]): Promise<any[]> {
    const parts: any[] = []

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
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
        tools: tools ? [{ functionDeclarations: tools }] : undefined,
      })

      // Build chat history from conversation buffer
      const history = conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))

      // Start chat with history
      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      })

      // Build message parts
      const messageParts: any[] = []

      // Add text if present
      if (userMessage.trim()) {
        messageParts.push({ text: userMessage })
      }

      // Add media if present
      if (mediaItems && mediaItems.length > 0) {
        const mediaParts = await this.convertMediaToParts(mediaItems)
        messageParts.push(...mediaParts)
      }

      // Send message with timeout
      const result = await this.withTimeout(
        chat.sendMessage(messageParts),
        this.timeout
      )

      const response = await result.response
      const text = response.text()

      // Check for function calls
      const functionCalls = response.functionCalls()

      const latency = Date.now() - startTime

      // Note: Google AI doesn't return token counts in the same way as OpenAI
      // We'll estimate or leave as 0 for now
      const tokensUsed = 0

      return {
        text,
        tokensUsed,
        latency,
        functionCalls: functionCalls ? functionCalls : undefined,
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
    // Don't throw in handleError since we already throw in catch block
    // Just log appropriately

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

    // For unhandled errors, try to log what we can
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
