// @root/src/helpers/toolStatus.ts
// Maps tool names to status message categories for personality-flavored status messages.

/**
 * Map tool names to status message category for personality-flavored status messages.
 */
export function getToolStatusCategory(toolNames: string[]): string {
  const memoryTools = ['remember_fact', 'update_memory']
  const recallTools = ['forget_memory', 'recall_memories']

  if (toolNames.some(n => memoryTools.includes(n)))
    return 'toolStatus.remembering'
  if (toolNames.some(n => recallTools.includes(n)))
    return 'toolStatus.recalling'

  // Known slash commands get "executing", unknown/unrecognized tools get "thinking"
  const knownSlashCommands = toolNames.some(n => !n.includes('_'))
  return knownSlashCommands ? 'toolStatus.executing' : 'toolStatus.thinking'
}
