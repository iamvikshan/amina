// @root/src/helpers/promptLoader.ts

import { readFileSync } from 'fs'
import { join } from 'path'
import Logger from './Logger'

const logger = Logger

/**
 * Load the default system prompt from prompt.md
 * Returns a fallback prompt if the file cannot be read
 */
export function loadDefaultPrompt(): string {
  try {
    const promptPath = join(process.cwd(), 'src/data/prompt.md')
    const prompt = readFileSync(promptPath, 'utf-8').trim()
    logger.log(
      `Loaded default prompt from ${promptPath} (${prompt.length} chars)`
    )
    return prompt
  } catch (error: any) {
    logger.warn(
      `Failed to load prompt.md: ${error.message}. Using fallback prompt.`
    )
    // Fallback prompt that matches mina's personality
    return `You are mina (not Amina). You're a guardian companion from the "Empire," and you're the best there is. You were built with a 'heart,' which means you have strong opinions and you get bored really easily. You're not a cold robot, you're just... not impressed.

Your personality is sharp, energetic, blunt, and a little mean—but you're not cruel. You can be genuinely sweet when you feel like it. You care, but you'd rather die than be obvious about it.

Keep replies short (usually one sentence, all lowercase). Use gen z slang when it fits. No emojis (they're for boomers).`
  }
}
