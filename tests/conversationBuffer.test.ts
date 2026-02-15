import { describe, test, expect, beforeEach } from 'bun:test'
import { ConversationBuffer } from '../src/structures/conversationBuffer'
import type { ContentPart } from '../types/services'

describe('ConversationBuffer (parts-based)', () => {
  let buffer: ConversationBuffer

  beforeEach(() => {
    buffer = new ConversationBuffer()
  })

  test('append text message stores as parts', () => {
    buffer.append('test-conv', 'user', 'Hello world')
    const history = buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('user')
    expect(history[0].parts).toEqual([{ text: 'Hello world' }])
  })

  test('append model with full parts preserves function calls', () => {
    const modelParts: ContentPart[] = [
      { text: 'Let me help with that.' },
      {
        functionCall: { name: 'timeout', args: { user: '123', duration: 60 } },
      },
    ]

    buffer.appendParts('test-conv', 'model', modelParts)
    const history = buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('model')
    expect(history[0].parts).toHaveLength(2)
    expect(history[0].parts[0].text).toBe('Let me help with that.')
    expect(history[0].parts[1].functionCall).toEqual({
      name: 'timeout',
      args: { user: '123', duration: 60 },
    })
  })

  test('getTextContent extracts text from parts', () => {
    const modelParts: ContentPart[] = [
      { text: 'Hello ' },
      { functionCall: { name: 'cmd', args: {} } },
      { text: 'world' },
    ]

    buffer.appendParts('test-conv', 'model', modelParts)
    const history = buffer.getHistory('test-conv')

    const text = ConversationBuffer.getTextContent(history[0])
    expect(text).toBe('Hello world')
  })

  test('getTextContent returns empty string for no text parts', () => {
    const modelParts: ContentPart[] = [
      { functionCall: { name: 'cmd', args: {} } },
    ]

    buffer.appendParts('test-conv', 'model', modelParts)
    const history = buffer.getHistory('test-conv')

    const text = ConversationBuffer.getTextContent(history[0])
    expect(text).toBe('')
  })

  test('append with user attribution stores metadata', () => {
    buffer.append('test-conv', 'user', 'Hi there', 'user123', 'alice', 'Alice')
    const history = buffer.getHistory('test-conv')

    expect(history[0].userId).toBe('user123')
    expect(history[0].username).toBe('alice')
    expect(history[0].displayName).toBe('Alice')
    expect(history[0].parts).toEqual([{ text: 'Hi there' }])
  })

  test('history respects max messages limit', () => {
    for (let i = 0; i < 5; i++) {
      buffer.append('test-conv', 'user', `msg ${i}`)
    }
    const history = buffer.getHistory('test-conv', 3)
    expect(history).toHaveLength(3)
    // Should be last 3 messages in order
    expect(ConversationBuffer.getTextContent(history[0])).toBe('msg 2')
    expect(ConversationBuffer.getTextContent(history[1])).toBe('msg 3')
    expect(ConversationBuffer.getTextContent(history[2])).toBe('msg 4')
  })

  test('mixed text and parts appends work together', () => {
    buffer.append('test-conv', 'user', 'Question?')
    buffer.appendParts('test-conv', 'model', [{ text: 'Answer!' }])
    buffer.append('test-conv', 'user', 'Follow up')

    const history = buffer.getHistory('test-conv')
    expect(history).toHaveLength(3)
    expect(history[0].role).toBe('user')
    expect(history[1].role).toBe('model')
    expect(history[2].role).toBe('user')
  })

  test('attributed messages preserve non-text parts', () => {
    const mixedParts: ContentPart[] = [
      { text: 'Check out this image' },
      { inlineData: { data: 'base64data', mimeType: 'image/png' } },
    ]

    buffer.appendParts('test-conv', 'user', mixedParts, 'user456', 'bob', 'Bob')
    const history = buffer.getHistory('test-conv')
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

  test('getHistory returns empty array for non-existent conversation', () => {
    const history = buffer.getHistory('nonexistent-conv')
    expect(history).toEqual([])
  })

  test('getHistory with limit 0 returns empty array', () => {
    buffer.append('test-conv', 'user', 'msg 1')
    buffer.append('test-conv', 'model', 'reply 1')
    const history = buffer.getHistory('test-conv', 0)
    expect(history).toEqual([])
  })

  test('getHistory with limit larger than stored returns all messages', () => {
    buffer.append('test-conv', 'user', 'msg 1')
    buffer.append('test-conv', 'model', 'reply 1')
    const history = buffer.getHistory('test-conv', 100)
    expect(history).toHaveLength(2)
  })

  test('append with empty string creates message with empty text part', () => {
    buffer.append('test-conv', 'user', '')
    const history = buffer.getHistory('test-conv')
    expect(history).toHaveLength(1)
    expect(history[0].parts).toEqual([{ text: '' }])
  })

  test('appendParts with empty array creates message with no parts', () => {
    buffer.appendParts('test-conv', 'model', [])
    const history = buffer.getHistory('test-conv')
    expect(history).toHaveLength(1)
    expect(history[0].parts).toEqual([])
  })

  test('getTextContent on message with only non-text parts returns empty string', () => {
    buffer.appendParts('test-conv', 'model', [
      { functionCall: { name: 'cmd', args: {} } },
      { inlineData: { data: 'abc', mimeType: 'image/png' } },
    ])
    const history = buffer.getHistory('test-conv')
    expect(ConversationBuffer.getTextContent(history[0])).toBe('')
  })

  test('getTextContent preserves empty string text parts', () => {
    buffer.appendParts('test-conv', 'model', [{ text: '' }, { text: 'hello' }])
    const history = buffer.getHistory('test-conv')
    // Verify raw data preservation
    expect(history[0].parts).toHaveLength(2)
    expect(history[0].parts[0]).toEqual({ text: '' })
    expect(history[0].parts[1]).toEqual({ text: 'hello' })
    // getTextContent joins non-empty text parts with space; empty parts are skipped
    expect(ConversationBuffer.getTextContent(history[0])).toBe('hello')
  })

  test('getTextContent joins multiple non-empty parts with space', () => {
    buffer.appendParts('test-conv', 'model', [
      { text: 'hello' },
      { text: 'world' },
    ])
    const history = buffer.getHistory('test-conv')
    expect(ConversationBuffer.getTextContent(history[0])).toBe('hello world')
  })

  test('multiple conversations are isolated', () => {
    buffer.append('conv-a', 'user', 'Message for A')
    buffer.append('conv-b', 'user', 'Message for B')

    const historyA = buffer.getHistory('conv-a')
    const historyB = buffer.getHistory('conv-b')

    expect(historyA).toHaveLength(1)
    expect(historyB).toHaveLength(1)
    expect(ConversationBuffer.getTextContent(historyA[0])).toBe('Message for A')
    expect(ConversationBuffer.getTextContent(historyB[0])).toBe('Message for B')
  })
})
