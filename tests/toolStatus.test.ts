import { describe, test, expect } from 'bun:test'
import responses from '../src/data/responses'
import { mina } from '../src/helpers/mina'
import { getToolStatusCategory } from '../src/helpers/toolStatus'

describe('Tool Status Messages', () => {
  test('toolStatus category exists in responses', () => {
    const toolStatus = (responses as any).toolStatus
    expect(toolStatus).toBeDefined()
    expect(typeof toolStatus).toBe('object')
  })

  test('toolStatus pools are non-empty arrays', () => {
    const toolStatus = (responses as any).toolStatus
    expect(toolStatus.thinking).toBeInstanceOf(Array)
    expect(toolStatus.thinking.length).toBeGreaterThan(0)
    expect(toolStatus.executing).toBeInstanceOf(Array)
    expect(toolStatus.executing.length).toBeGreaterThan(0)
    expect(toolStatus.remembering).toBeInstanceOf(Array)
    expect(toolStatus.remembering.length).toBeGreaterThan(0)
    expect(toolStatus.recalling).toBeInstanceOf(Array)
    expect(toolStatus.recalling.length).toBeGreaterThan(0)
  })

  test('all status messages are non-empty strings', () => {
    const toolStatus = (responses as any).toolStatus
    for (const [category, messages] of Object.entries(toolStatus)) {
      expect(Array.isArray(messages), `${category} should be an array`).toBe(
        true
      )
      for (const msg of messages as string[]) {
        expect(typeof msg).toBe('string')
        expect(msg.length).toBeGreaterThan(0)
      }
    }
  })

  test('mina.say returns string from toolStatus.thinking pool', () => {
    const thinking = mina.say('toolStatus.thinking')
    expect(typeof thinking).toBe('string')
    expect(thinking.length).toBeGreaterThan(0)
    expect(thinking).not.toBe('hmm.')
  })

  test('mina.say returns string from toolStatus.executing pool', () => {
    const executing = mina.say('toolStatus.executing')
    expect(typeof executing).toBe('string')
    expect(executing.length).toBeGreaterThan(0)
    expect(executing).not.toBe('hmm.')
  })

  test('mina.say returns string from toolStatus.remembering pool', () => {
    const remembering = mina.say('toolStatus.remembering')
    expect(typeof remembering).toBe('string')
    expect(remembering.length).toBeGreaterThan(0)
    expect(remembering).not.toBe('hmm.')
  })

  test('mina.say returns string from toolStatus.recalling pool', () => {
    const recalling = mina.say('toolStatus.recalling')
    expect(typeof recalling).toBe('string')
    expect(recalling.length).toBeGreaterThan(0)
    expect(recalling).not.toBe('hmm.')
  })

  describe('getToolStatusCategory', () => {
    test('function exists and is callable', () => {
      expect(typeof getToolStatusCategory).toBe('function')
    })

    test('memory tools map to toolStatus.remembering', () => {
      expect(getToolStatusCategory(['remember_fact'])).toBe(
        'toolStatus.remembering'
      )
      expect(getToolStatusCategory(['update_memory'])).toBe(
        'toolStatus.remembering'
      )
      expect(getToolStatusCategory(['remember_fact', 'some_other_tool'])).toBe(
        'toolStatus.remembering'
      )
    })

    test('recall tools map to toolStatus.recalling', () => {
      expect(getToolStatusCategory(['recall_memories'])).toBe(
        'toolStatus.recalling'
      )
      expect(getToolStatusCategory(['forget_memory'])).toBe(
        'toolStatus.recalling'
      )
    })

    test('regular command tools map to toolStatus.executing', () => {
      expect(getToolStatusCategory(['play'])).toBe('toolStatus.executing')
      expect(getToolStatusCategory(['ban', 'kick'])).toBe(
        'toolStatus.executing'
      )
    })

    test('unknown tools with underscores fall back to toolStatus.thinking', () => {
      expect(getToolStatusCategory(['unknown_tool_xyz'])).toBe(
        'toolStatus.thinking'
      )
    })
  })
})
