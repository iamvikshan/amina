/// <reference path="../types/services.d.ts" />
import { describe, test, expect, beforeEach, mock } from 'bun:test'

// Mock DB functions so tests don't hit real MongoDB
void mock.module('../src/database/schemas/Conversation', () => ({
  upsertConversation: mock(() => Promise.resolve()),
  loadConversation: mock(() => Promise.resolve(null)),
  deleteConversation: mock(() => Promise.resolve()),
}))

import { ConversationBuffer } from '../src/structures/conversationBuffer'
import type { Message } from '../src/structures/conversationBuffer'

describe('ConversationBuffer (OpenAI-compatible)', () => {
  let buffer: ConversationBuffer

  beforeEach(() => {
    buffer = new ConversationBuffer()
  })

  test('append user message stores as content string', async () => {
    buffer.append('test-conv', 'user', 'Hello world')
    const history = await buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('user')
    expect(history[0].content).toBe('Hello world')
  })

  test('append assistant message stores content', async () => {
    buffer.append('test-conv', 'assistant', 'I can help with that.')
    const history = await buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('assistant')
    expect(history[0].content).toBe('I can help with that.')
  })

  test('appendAssistantMessage with tool calls', async () => {
    const toolCalls: ToolCall[] = [
      {
        id: 'call_1',
        type: 'function',
        function: { name: 'timeout', arguments: '{"user":"123","duration":60}' },
      },
    ]

    buffer.appendAssistantMessage('test-conv', 'Let me help.', toolCalls)
    const history = await buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('assistant')
    expect(history[0].content).toBe('Let me help.')
    expect(history[0].tool_calls).toEqual(toolCalls)
  })

  test('appendToolResult stores tool message', async () => {
    buffer.appendToolResult('test-conv', 'call_1', 'timeout', '{"ok":true}')
    const history = await buffer.getHistory('test-conv')

    expect(history).toHaveLength(1)
    expect(history[0].role).toBe('tool')
    expect(history[0].tool_call_id).toBe('call_1')
    expect(history[0].name).toBe('timeout')
    expect(history[0].content).toBe('{"ok":true}')
  })

  test('getTextContent returns content string', () => {
    const msg: Message = { role: 'user', content: 'Hello world', timestamp: Date.now() }
    expect(ConversationBuffer.getTextContent(msg)).toBe('Hello world')
  })

  test('getTextContent returns empty for empty content', () => {
    const msg: Message = { role: 'assistant', content: '', timestamp: Date.now() }
    expect(ConversationBuffer.getTextContent(msg)).toBe('')
  })

  test('append with user attribution stores metadata', async () => {
    buffer.append('test-conv', 'user', 'Hi there', 'user123', 'alice', 'Alice')
    const history = await buffer.getHistory('test-conv')

    expect(history[0].userId).toBe('user123')
    expect(history[0].username).toBe('alice')
    expect(history[0].displayName).toBe('Alice')
    expect(history[0].content).toBe('Hi there')
  })

  test('history respects max messages limit', async () => {
    for (let i = 0; i < 5; i++) {
      buffer.append('test-conv', 'user', `msg ${i}`)
    }
    const history = await buffer.getHistory('test-conv', 3)
    expect(history).toHaveLength(3)
    expect(history[0].content).toBe('msg 2')
    expect(history[1].content).toBe('msg 3')
    expect(history[2].content).toBe('msg 4')
  })

  test('formatWithAttribution prepends display name for user messages', () => {
    const msg: Message = {
      role: 'user',
      content: 'Hi',
      timestamp: Date.now(),
      userId: 'u1',
      username: 'alice',
      displayName: 'Alice',
    }
    const formatted = ConversationBuffer.formatWithAttribution(msg)
    expect(formatted.role).toBe('user')
    expect(formatted.content).toBe('Alice: Hi')
  })

  test('formatWithAttribution preserves assistant messages', () => {
    const msg: Message = {
      role: 'assistant',
      content: 'Sure thing!',
      timestamp: Date.now(),
      tool_calls: [
        { id: 'c1', type: 'function', function: { name: 'cmd', arguments: '{}' } },
      ],
    }
    const formatted = ConversationBuffer.formatWithAttribution(msg)
    expect(formatted.role).toBe('assistant')
    expect(formatted.content).toBe('Sure thing!')
    expect(formatted.tool_calls).toEqual(msg.tool_calls)
  })

  test('formatWithAttribution preserves tool messages', () => {
    const msg: Message = {
      role: 'tool',
      content: '{"result":true}',
      timestamp: Date.now(),
      tool_call_id: 'call_1',
      name: 'timeout',
    }
    const formatted = ConversationBuffer.formatWithAttribution(msg)
    expect(formatted.role).toBe('tool')
    expect(formatted.content).toBe('{"result":true}')
    expect(formatted.tool_call_id).toBe('call_1')
    expect(formatted.name).toBe('timeout')
  })

  test('append with empty string is a no-op', async () => {
    buffer.append('test-conv', 'user', '')
    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(0)
  })

  test('getHistory returns empty for non-existent conversation', async () => {
    const history = await buffer.getHistory('nonexistent-conv')
    expect(history).toEqual([])
  })

  test('getHistory with limit 0 returns empty', async () => {
    buffer.append('test-conv', 'user', 'msg 1')
    buffer.append('test-conv', 'assistant', 'reply 1')
    const history = await buffer.getHistory('test-conv', 0)
    expect(history).toEqual([])
  })
})

describe('ConversationBuffer.sanitizeToolPairs', () => {
  const ts = Date.now()
  const toolCall: ToolCall = {
    id: 'call_1',
    type: 'function',
    function: { name: 'daily', arguments: '{}' },
  }

  test('drops leading orphan tool messages', () => {
    const messages: Message[] = [
      { role: 'tool', content: 'result', timestamp: ts, tool_call_id: 'call_1', name: 'daily' },
      { role: 'user', content: 'hello', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('user')
  })

  test('preserves complete assistant/tool pair after user message', () => {
    const messages: Message[] = [
      { role: 'user', content: 'check daily', timestamp: ts },
      { role: 'assistant', content: '', timestamp: ts, tool_calls: [toolCall] },
      { role: 'tool', content: 'ok', timestamp: ts, tool_call_id: 'call_1', name: 'daily' },
      { role: 'assistant', content: 'Done!', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toHaveLength(4)
    expect(result[1].tool_calls).toEqual([toolCall])
    expect(result[2].role).toBe('tool')
    expect(result[3].content).toBe('Done!')
  })

  test('drops leading assistant+tool group without preceding user message', () => {
    const messages: Message[] = [
      { role: 'assistant', content: '', timestamp: ts, tool_calls: [toolCall] },
      { role: 'tool', content: 'ok', timestamp: ts, tool_call_id: 'call_1', name: 'daily' },
      { role: 'user', content: 'hello', timestamp: ts },
      { role: 'assistant', content: 'hi!', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toHaveLength(2)
    expect(result[0].role).toBe('user')
    expect(result[1].content).toBe('hi!')
  })

  test('preserves leading assistant text but strips tool_calls when content is non-empty', () => {
    const messages: Message[] = [
      { role: 'assistant', content: 'I checked your balance.', timestamp: ts, tool_calls: [toolCall] },
      { role: 'tool', content: 'ok', timestamp: ts, tool_call_id: 'call_1', name: 'daily' },
      { role: 'user', content: 'hello', timestamp: ts },
      { role: 'assistant', content: 'hi!', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toHaveLength(3)
    expect(result[0].role).toBe('assistant')
    expect(result[0].content).toBe('I checked your balance.')
    expect(result[0].tool_calls).toBeUndefined()
    expect(result[1].role).toBe('user')
    expect(result[2].content).toBe('hi!')
  })

  test('strips tool_calls from assistant when responses are missing (mid-conversation)', () => {
    const messages: Message[] = [
      { role: 'user', content: 'do something', timestamp: ts },
      { role: 'assistant', content: 'Let me check.', timestamp: ts, tool_calls: [toolCall] },
      { role: 'user', content: 'next message', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toHaveLength(3)
    expect(result[0].role).toBe('user')
    expect(result[1].role).toBe('assistant')
    expect(result[1].content).toBe('Let me check.')
    expect(result[1].tool_calls).toBeUndefined()
  })

  test('handles multiple tool calls with partial responses (mid-conversation)', () => {
    const call2: ToolCall = {
      id: 'call_2',
      type: 'function',
      function: { name: 'balance', arguments: '{}' },
    }
    const messages: Message[] = [
      { role: 'user', content: 'do stuff', timestamp: ts },
      { role: 'assistant', content: '', timestamp: ts, tool_calls: [toolCall, call2] },
      { role: 'tool', content: 'ok', timestamp: ts, tool_call_id: 'call_1', name: 'daily' },
      // Missing tool response for call_2
      { role: 'assistant', content: 'partial', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    // User kept, incomplete pair: assistant text kept but tool_calls stripped, orphan tool dropped
    expect(result).toHaveLength(3)
    expect(result[0].role).toBe('user')
    expect(result[1].tool_calls).toBeUndefined()
    expect(result[1].content).toBe('')
    expect(result[2].content).toBe('partial')
  })

  test('returns empty array for empty input', () => {
    expect(ConversationBuffer.sanitizeToolPairs([])).toEqual([])
  })

  test('passes through plain messages unchanged', () => {
    const messages: Message[] = [
      { role: 'user', content: 'hi', timestamp: ts },
      { role: 'assistant', content: 'hello', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toEqual(messages)
  })

  test('drops mid-conversation orphan tool messages', () => {
    const messages: Message[] = [
      { role: 'user', content: 'hello', timestamp: ts },
      { role: 'assistant', content: '', timestamp: ts, tool_calls: [toolCall] },
      { role: 'tool', content: 'done', timestamp: ts, tool_call_id: 'call_1', name: 'daily' },
      { role: 'assistant', content: 'here you go', timestamp: ts },
      { role: 'tool', content: 'orphan', timestamp: ts, tool_call_id: 'call_X', name: 'unknown' },
      { role: 'user', content: 'thanks', timestamp: ts },
    ]
    const result = ConversationBuffer.sanitizeToolPairs(messages)
    expect(result).toHaveLength(5)
    expect(result.map(m => m.role)).toEqual(['user', 'assistant', 'tool', 'assistant', 'user'])
    expect(result.every(m => m.role !== 'tool' || m.tool_call_id === 'call_1')).toBe(true)
  })
})
