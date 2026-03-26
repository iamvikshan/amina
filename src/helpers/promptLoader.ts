// @root/src/helpers/promptLoader.ts

import { readFileSync } from 'fs'
import { join } from 'path'
import Logger from '@helpers/Logger'

let cachedPrompt: string | null = null

export const FALLBACK_PROMPT =
  'you are mina. all lowercase, short replies, gen z slang, no emojis, kaomoji only.'

/**
 * Load the system prompt from src/data/prompt.md
 * Caches on success. Returns FALLBACK_PROMPT on failure (not cached, retries next call).
 * @returns {string} The prompt content or fallback
 */
export function loadPrompt(): string {
  if (cachedPrompt) return cachedPrompt
  try {
    const promptPath = join(process.cwd(), 'src/data/prompt.md')
    const prompt = readFileSync(promptPath, 'utf-8').trim()
    if (!prompt) throw new Error('prompt.md is empty')
    cachedPrompt = prompt
    return prompt
  } catch (err) {
    Logger.warn(
      `Failed to load prompt.md, using fallback: ${err instanceof Error ? err.message : String(err)}`
    )
    return FALLBACK_PROMPT
  }
}

/** Reset the cached prompt (test-only) */
export function _resetCache(): void {
  cachedPrompt = null
}
