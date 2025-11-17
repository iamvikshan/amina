import type { AutocompleteInteraction } from 'discord.js'
import type { BotClient } from '@structures/BotClient'

/**
 * Centralized registry for autocomplete providers
 * Format: Map<`${commandName}:${optionName}`, handler>
 */
export const autocompleteProviders = new Map<
  string,
  (interaction: AutocompleteInteraction) => Promise<void>
>()

/**
 * Register an autocomplete provider
 * @param commandName - The command name (e.g., 'dev')
 * @param optionName - The option name (e.g., 'command')
 * @param handler - The autocomplete handler function
 */
export function registerAutocomplete(
  commandName: string,
  optionName: string,
  handler: (interaction: AutocompleteInteraction) => Promise<void>
): void {
  const key = `${commandName}:${optionName}`
  autocompleteProviders.set(key, handler)
}

/**
 * Handle autocomplete interaction
 * Routes to the appropriate provider based on command and option name
 */
export async function handleAutocomplete(
  interaction: AutocompleteInteraction
): Promise<void> {
  const commandName = interaction.commandName
  const focused = interaction.options.getFocused(true)
  const optionName = focused.name

  const key = `${commandName}:${optionName}`
  const provider = autocompleteProviders.get(key)

  if (provider) {
    await provider(interaction)
  } else {
    // No provider found - respond with empty array
    await interaction.respond([])
  }
}
