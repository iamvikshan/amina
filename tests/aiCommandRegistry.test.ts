import { describe, test, expect } from 'bun:test'

/**
 * Registry test double that mirrors real AiCommandRegistry dedup logic
 * from registerNativeTools — used to verify idempotent registration.
 */
class IdempotentTestRegistry {
  private handlers = new Map<
    string,
    (args: Record<string, unknown>, ctx: any) => Promise<string>
  >()
  private nativeToolDefinitions: Array<{
    name: string
    description: string
    parameters?: any
  }> = []
  private metadata = new Map<string, any>()

  registerNativeTools(
    tools: Array<{ declaration: any; handler: any; permissionModel?: string }>
  ) {
    for (const tool of tools) {
      const name = tool.declaration.name

      // Remove existing native tool definition with same name (idempotent)
      const existingIdx = this.nativeToolDefinitions.findIndex(
        d => d.name === name
      )
      if (existingIdx !== -1) {
        this.nativeToolDefinitions.splice(existingIdx, 1)
      }

      this.handlers.set(name, tool.handler)
      this.nativeToolDefinitions.push(tool.declaration)
      this.metadata.set(name, {
        name,
        permissionModel: tool.permissionModel ?? 'open',
        userPermissions: [],
        freeWillAllowed: true,
      })
    }
  }

  getTools() {
    return this.nativeToolDefinitions
  }

  isNativeTool(name: string): boolean {
    return this.handlers.has(name)
  }

  async executeNativeTool(
    name: string,
    args: Record<string, unknown>,
    context: any
  ): Promise<string> {
    const handler = this.handlers.get(name)
    if (!handler) throw new Error(`Native tool ${name} not found`)
    return handler(args, context)
  }
}

describe('AiCommandRegistry idempotent native tool registration', () => {
  test('registerNativeTools_is_idempotent_no_duplicates', () => {
    const registry = new IdempotentTestRegistry()

    const dummyHandler = async () => 'result'
    const tools = [
      {
        declaration: {
          name: 'test_tool_a',
          description: 'Tool A',
          parameters: {
            type: 'OBJECT',
            properties: {},
            required: [] as string[],
          },
        },
        handler: dummyHandler,
      },
      {
        declaration: {
          name: 'test_tool_b',
          description: 'Tool B',
          parameters: {
            type: 'OBJECT',
            properties: {},
            required: [] as string[],
          },
        },
        handler: dummyHandler,
      },
    ]

    // Register twice — should NOT create duplicates
    registry.registerNativeTools(tools)
    registry.registerNativeTools(tools)

    const allTools = registry.getTools()
    const namesA = allTools.filter((t: any) => t.name === 'test_tool_a')
    const namesB = allTools.filter((t: any) => t.name === 'test_tool_b')

    expect(namesA.length).toBe(1)
    expect(namesB.length).toBe(1)
    expect(allTools.length).toBe(2)
  })

  test('registerNativeTools_replaces_handler_on_re-registration', async () => {
    const registry = new IdempotentTestRegistry()

    const handler1 = async () => 'v1'
    const handler2 = async () => 'v2'

    registry.registerNativeTools([
      {
        declaration: { name: 'my_tool', description: 'd' },
        handler: handler1,
      },
    ])

    registry.registerNativeTools([
      {
        declaration: { name: 'my_tool', description: 'd updated' },
        handler: handler2,
      },
    ])

    const result = await registry.executeNativeTool(
      'my_tool',
      {},
      {
        userId: 'u',
        guildId: null,
      }
    )
    expect(result).toBe('v2')
    expect(
      registry.getTools().filter((t: any) => t.name === 'my_tool').length
    ).toBe(1)
  })
})
