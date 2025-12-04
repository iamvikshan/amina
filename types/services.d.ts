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

  interface AiResponse {
    text: string
    tokensUsed: number
    latency: number
    functionCalls?: { name: string; args: any }[]
  }

  interface ConversationMessage {
    role: 'user' | 'model'
    content: string
  }
}

export { }

