// Service-related type definitions

declare global {
  type ResponseMode = 'dm' | 'mention' | 'freeWill' | false

  interface RateLimitEntry {
    timestamp: number
  }

  interface MemoryFact {
    key: string
    value: string
    importance: number
    memoryType?: 'user' | 'guild' | 'topic'
  }

  interface RecalledMemory {
    id: string | number
    key: string
    value: string
    score: number
    context: string
  }

  /**
   * Represents a single part of a Content message.
   * Matches the Google GenAI SDK Part shape.
   * Only one of these fields should be set per instance:
   * - text: Plain text content
   * - inlineData: Base64-encoded media (images, audio, video)
   * - functionCall: A function/tool call from the model
   * - functionResponse: A response to a function call
   */
  interface ContentPart {
    text?: string
    inlineData?: { data: string; mimeType: string }
    functionCall?: { name: string; args: Record<string, any> }
    functionResponse?: { name: string; response: Record<string, any> }
  }

  interface AiResponse {
    text: string
    tokensUsed: number
    latency: number
    functionCalls?: { name: string; args: any }[]
    modelContent?: ContentPart[] // Full model response parts for history preservation
  }

  interface ConversationMessage {
    role: 'user' | 'model'
    parts: ContentPart[]
  }
}

export type { ContentPart }

