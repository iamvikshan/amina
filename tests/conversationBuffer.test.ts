import { describe, test, expect, beforeEach, mock } from 'bun:test'
import type { ContentPart } from '../types/services'

// Mock DB functions so tests don't hit real MongoDB
mock.module('../src/database/schemas/Conversation', () => ({
  upsertConversation: mock(() => Promise.resolve()),
  loadConversation: mock(() => Promise.resolve(null)),
  deleteConversation: mock(() => Promise.resolve()),
}))

import { ConversationBuffer } from '../src/structures/conversationBuffer'

describe('ConversationBuffer (parts-based)', () => {
  let buffer: ConversationBuffer

  beforeEach(() => {
    buffer = new ConversationBuffer()
  })

  test('append text message stores as parts', async () => {
    buffer.append('test-conv', 'user', 'Hello world')
    const history = await buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('user')
    expect(history[0].parts).toEqual([{ text: 'Hello world' }])
  })

  test('append model with full parts preserves function calls', async () => {
    const modelParts: ContentPart[] = [
      { text: 'Let me help with that.' },
      {
        functionCall: { name: 'timeout', args: { user: '123', duration: 60 } },
      },
    ]

    buffer.appendParts('test-conv', 'model', modelParts)
    const history = await buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('model')
    expect(history[0].parts).toHaveLength(2)
    expect(history[0].parts[0].text).toBe('Let me help with that.')
    expect(history[0].parts[1].functionCall).toEqual({
      name: 'timeout',
      args: { user: '123', duration: 60 },
    })
  })

  test('getTextContent extracts text from parts', async () => {
    const modelParts: ContentPart[] = [
      { text: 'Hello ' },
      { functionCall: { name: 'cmd', args: {} } },
      { text: 'world' },
    ]

    buffer.appendParts('test-conv', 'model', modelParts)
    const history = await buffer.getHistory('test-conv')

    const text = ConversationBuffer.getTextContent(history[0])
    expect(text).toBe('Hello world')
  })

  test('getTextContent returns empty string for no text parts', async () => {
    const modelParts: ContentPart[] = [
      { functionCall: { name: 'cmd', args: {} } },
    ]

    buffer.appendParts('test-conv', 'model', modelParts)
    const history = await buffer.getHistory('test-conv')

    const text = ConversationBuffer.getTextContent(history[0])
    expect(text).toBe('')
  })

  test('append with user attribution stores metadata', async () => {
    buffer.append('test-conv', 'user', 'Hi there', 'user123', 'alice', 'Alice')
    const history = await buffer.getHistory('test-conv')

    expect(history[0].userId).toBe('user123')
    expect(history[0].username).toBe('alice')
    expect(history[0].displayName).toBe('Alice')
    expect(history[0].parts).toEqual([{ text: 'Hi there' }])
  })

  test('history respects max messages limit', async () => {
    for (let i = 0; i < 5; i++) {
      buffer.append('test-conv', 'user', `msg ${i}`)
    }
    const history = await buffer.getHistory('test-conv', 3)
    expect(history).toHaveLength(3)
    // Should be last 3 messages in order
    expect(ConversationBuffer.getTextContent(history[0])).toBe('msg 2')
    expect(ConversationBuffer.getTextContent(history[1])).toBe('msg 3')
    expect(ConversationBuffer.getTextContent(history[2])).toBe('msg 4')
  })

  test('mixed text and parts appends work together', async () => {
    buffer.append('test-conv', 'user', 'Question?')
    buffer.appendParts('test-conv', 'model', [{ text: 'Answer!' }])
    buffer.append('test-conv', 'user', 'Follow up')

    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(3)
    expect(history[0].role).toBe('user')
    expect(history[1].role).toBe('model')
    expect(history[2].role).toBe('user')
  })

  test('attributed messages preserve non-text parts', async () => {
    const mixedParts: ContentPart[] = [
      { text: 'Check out this image' },
      { inlineData: { data: 'base64data', mimeType: 'image/png' } },
    ]

    buffer.appendParts('test-conv', 'user', mixedParts, 'user456', 'bob', 'Bob')
    const history = await buffer.getHistory('test-conv')
    const msg = history[0]

    // Use the production formatter
    const attributed = ConversationBuffer.formatWithAttribution(msg)

    expect(attributed.parts).toHaveLength(2)
    expect(attributed.parts[0].text).toBe('Bob: Check out this image')
    expect(attributed.parts[1].inlineData).toEqual({
      data: 'base64data',
      mimeType: 'image/png',
    })
  })

  test('getHistory returns empty array for non-existent conversation', async () => {
    const history = await buffer.getHistory('nonexistent-conv')
    expect(history).toEqual([])
  })

  test('getHistory with limit 0 returns empty array', async () => {
    buffer.append('test-conv', 'user', 'msg 1')
    buffer.append('test-conv', 'model', 'reply 1')
    const history = await buffer.getHistory('test-conv', 0)
    expect(history).toEqual([])
  })

  test('getHistory with limit larger than stored returns all messages', async () => {
    buffer.append('test-conv', 'user', 'msg 1')
    buffer.append('test-conv', 'model', 'reply 1')
    const history = await buffer.getHistory('test-conv', 100)
    expect(history).toHaveLength(2)
  })

  test('append with empty string is a no-op', async () => {
    buffer.append('test-conv', 'user', '')
    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(0)
  })

  test('appendParts with empty array is a no-op', async () => {
    buffer.appendParts('test-conv', 'model', [])
    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(0)
  })

  test('appendParts with empty array does not affect existing messages', async () => {
    buffer.append('test-conv', 'user', 'existing message')
    buffer.appendParts('test-conv', 'model', [])
    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(1)
    expect(ConversationBuffer.getTextContent(history[0])).toBe(
      'existing message'
    )
  })

  test('getTextContent on message with only non-text parts returns empty string', async () => {
    buffer.appendParts('test-conv', 'model', [
      { functionCall: { name: 'cmd', args: {} } },
      { inlineData: { data: 'abc', mimeType: 'image/png' } },
    ])
    const history = await buffer.getHistory('test-conv')
    expect(ConversationBuffer.getTextContent(history[0])).toBe('')
  })

  test('getTextContent preserves empty string text parts', async () => {
    buffer.appendParts('test-conv', 'model', [{ text: '' }, { text: 'hello' }])
    const history = await buffer.getHistory('test-conv')
    // Verify raw data preservation
    expect(history[0].parts).toHaveLength(2)
    expect(history[0].parts[0]).toEqual({ text: '' })
    expect(history[0].parts[1]).toEqual({ text: 'hello' })
    // getTextContent joins non-empty text parts with space; empty parts are skipped
    expect(ConversationBuffer.getTextContent(history[0])).toBe('hello')
  })

  test('getTextContent joins multiple non-empty parts with space', async () => {
    buffer.appendParts('test-conv', 'model', [
      { text: 'hello' },
      { text: 'world' },
    ])
    const history = await buffer.getHistory('test-conv')
    expect(ConversationBuffer.getTextContent(history[0])).toBe('hello world')
  })

  test('multiple conversations are isolated', async () => {
    buffer.append('conv-a', 'user', 'Message for A')
    buffer.append('conv-b', 'user', 'Message for B')

    const historyA = await buffer.getHistory('conv-a')
    const historyB = await buffer.getHistory('conv-b')

    expect(historyA).toHaveLength(1)
    expect(historyB).toHaveLength(1)
    expect(ConversationBuffer.getTextContent(historyA[0])).toBe('Message for A')
    expect(ConversationBuffer.getTextContent(historyB[0])).toBe('Message for B')
  })
})
