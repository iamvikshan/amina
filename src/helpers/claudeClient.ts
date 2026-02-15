// @root/src/helpers/claudeClient.ts

import AnthropicVertex, { type ClientOptions } from '@anthropic-ai/vertex-sdk'
import { APIError } from '@anthropic-ai/vertex-sdk/core/error'
import { GoogleAuth, type JWTInput } from 'google-auth-library'
import Logger from './Logger'

export interface ClaudeResponse {
  text: string
  tokensUsed: number
  latency: number
}

/**
 * Claude client for text-only reasoning tasks via Vertex AI Model Garden.
 * Does NOT support tool calling — for reasoning/analysis tasks only.
 */
export class ClaudeClient {
  private client: AnthropicVertex
  private model: string
  private timeout: number

  constructor(config: {
    project: string
    location: string
    model: string
    timeout: number
    credentials?: JWTInput
  }) {
    const clientOptions: ClientOptions = {
      projectId: config.project,
      region: config.location,
    }
    if (config.credentials) {
      clientOptions.googleAuth = new GoogleAuth({
        credentials: config.credentials,
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      })
    }
    this.client = new AnthropicVertex(clientOptions)
    this.model = config.model
    this.timeout = config.timeout
  }

  /**
   * Generate a text-only response using Claude.
   * No tool calling support — use for reasoning/analysis tasks.
   */
  async generateText(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = 1024,
    temperature: number = 0.7
  ): Promise<ClaudeResponse> {
    const startTime = Date.now()

    try {
      const response = await this.withTimeout(
        this.client.messages.create({
          model: this.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          temperature,
        }),
        this.timeout
      )

      const text = response.content
        .filter(block => block.type === 'text')
        .map(block => ('text' in block ? block.text : ''))
        .join('')

      const tokensUsed =
        (response.usage?.input_tokens ?? 0) +
        (response.usage?.output_tokens ?? 0)

      return {
        text,
        tokensUsed,
        latency: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const latency = Date.now() - startTime
      const message = error instanceof Error ? error.message : String(error)
      const status = error instanceof APIError ? error.status : 'unknown'
      Logger.error(
        `Claude API error: ${message}`,
        error instanceof APIError
          ? error
          : error instanceof Error
            ? error
            : new Error(message)
      )
      Logger.debug(
        `Claude error details: status=${status}, latency=${latency}ms`
      )
      throw error
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timerId!: ReturnType<typeof setTimeout>
    return Promise.race([
      promise.finally(() => clearTimeout(timerId)),
      new Promise<T>((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error('Claude API timeout')),
          timeoutMs
        )
      }),
    ])
  }
}
