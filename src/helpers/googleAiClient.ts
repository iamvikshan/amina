// @root/src/helpers/googleAiClient.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import Logger from './Logger'

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

  async generateResponse(
    systemPrompt: string,
    conversationHistory: globalThis.ConversationMessage[],
    userMessage: string,
    maxTokens: number,
    temperature: number
  ): Promise<globalThis.AiResponse> {
    const startTime = Date.now()

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
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

      // Send message with timeout
      const result = await this.withTimeout(
        chat.sendMessage(userMessage),
        this.timeout
      )

      const response = await result.response
      const text = response.text()
      const latency = Date.now() - startTime

      // Note: Google AI doesn't return token counts in the same way as OpenAI
      // We'll estimate or leave as 0 for now
      const tokensUsed = 0

      logger.debug(
        `AI response generated in ${latency}ms, ${text.length} chars`
      )

      return { text, tokensUsed, latency }
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
    } catch (logError) {
      logger.error('Failed to log AI error details')
    }
  }
}
