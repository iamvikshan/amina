import type { AutocompleteInteraction } from 'discord.js'

/**
 * Centralized registry for autocomplete providers
 * Format: Map<`${commandName}:${optionName}`, handler>
 * @returns {void} Nothing.
 */
export const autocompleteProviders = new Map<
  string,
  (interaction: AutocompleteInteraction) => Promise<void>
>()

/**
 * Register an autocomplete provider
 * @param {string} commandName - The command name (e.g., 'dev')
 * @param {string} optionName - The option name (e.g., 'command')
 * @param {Object} handler - The autocomplete handler function
 * @returns {void} Nothing.
 */
export function registerAutocomplete(
  commandName: string,
  optionName: string,
  handler: (interaction: AutocompleteInteraction) => Promise<void>,
): void {
  const key = `${commandName}:${optionName}`
  autocompleteProviders.set(key, handler)
}

/**
 * Handle autocomplete interaction
 * Routes to the appropriate provider based on command and option name
 * @param {AutocompleteInteraction} interaction - The interaction object
 * @returns {void} Nothing.
 */
export async function handleAutocomplete(
  interaction: AutocompleteInteraction,
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
