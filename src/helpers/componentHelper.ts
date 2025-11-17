import {
  Message,
  ComponentType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageComponentInteraction,
} from 'discord.js'

/**
 * Await a component interaction with timeout handling
 * Automatically disables components on timeout
 */
export async function awaitComponentWithTimeout(
  message: Message,
  filter: (i: MessageComponentInteraction) => boolean,
  timeoutMs: number = 60_000
): Promise<MessageComponentInteraction | null> {
  try {
    return await message.awaitMessageComponent({
      filter,
      time: timeoutMs,
    })
  } catch (err) {
    // Timeout occurred - disable all components
    await disableComponents(message)
    return null
  }
}

/**
 * Disable all components in a message
 * Useful for timeout or after action completion
 */
export async function disableComponents(message: Message): Promise<void> {
  try {
    const disabledRows = message.components.map(row => {
      // Check if row has components property (ActionRow)
      if (!('components' in row)) {
        return row
      }

      const components = row.components.map(component => {
        if (component.type === ComponentType.Button) {
          return ButtonBuilder.from(component as any).setDisabled(true)
        }
        if (component.type === ComponentType.StringSelect) {
          return StringSelectMenuBuilder.from(component as any).setDisabled(
            true
          )
        }
        // Add other component types as needed
        return component
      })

      return new ActionRowBuilder<any>().addComponents(components)
    })

    await message.edit({ components: disabledRows })
  } catch (err) {
    // Message may have been deleted or we don't have permissions
    console.error('Failed to disable components:', err)
  }
}

/**
 * Parse custom_id state from pipe-delimited format
 * Example: "roles:menu:cleanup|page:2|filter:prefix" -> { page: "2", filter: "prefix" }
 */
export function parseCustomIdState(customId: string): {
  base: string
  state: Record<string, string>
} {
  const [base, ...stateParts] = customId.split('|')
  const state: Record<string, string> = {}

  for (const part of stateParts) {
    const [key, value] = part.split(':')
    if (key && value) {
      state[key] = value
    }
  }

  return { base, state }
}

/**
 * Build custom_id with state
 * Example: buildCustomId("roles:menu:cleanup", { page: 2, filter: "prefix" })
 *   -> "roles:menu:cleanup|page:2|filter:prefix"
 */
export function buildCustomId(
  base: string,
  state?: Record<string, string | number>
): string {
  if (!state || Object.keys(state).length === 0) {
    return base
  }

  const stateParts = Object.entries(state).map(
    ([key, value]) => `${key}:${value}`
  )
  return `${base}|${stateParts.join('|')}`
}

/**
 * Validate that custom_id length is within Discord's limit (100 chars)
 */
export function validateCustomIdLength(customId: string): boolean {
  if (customId.length > 100) {
    console.warn(
      `Custom ID exceeds 100 characters: ${customId.length} chars - "${customId}"`
    )
    return false
  }
  return true
}

/**
 * Create a Primary button (Blue/Blurple)
 * Usage: General purpose actions
 */
export function createPrimaryBtn(
  options: ButtonOptions
): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(ButtonStyle.Primary)

  if (options.emoji) button.setEmoji(options.emoji)
  if (options.disabled) button.setDisabled(options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}

/**
 * Create a Secondary button (Grey)
 * Usage: Neutral or lower priority actions
 */
export function createSecondaryBtn(
  options: ButtonOptions
): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(ButtonStyle.Secondary)

  if (options.emoji) button.setEmoji(options.emoji)
  if (options.disabled) button.setDisabled(options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}

/**
 * Create a Success button (Green)
 * Usage: Confirmations or positive actions
 */
export function createSuccessBtn(
  options: ButtonOptions
): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(ButtonStyle.Success)

  if (options.emoji) button.setEmoji(options.emoji)
  if (options.disabled) button.setDisabled(options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}

/**
 * Create a Danger button (Red)
 * Usage: Destructive or risky actions
 */
export function createDangerBtn(
  options: ButtonOptions
): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(ButtonStyle.Danger)

  if (options.emoji) button.setEmoji(options.emoji)
  if (options.disabled) button.setDisabled(options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}

/**
 * Create a Link button (Grey with URL)
 * Usage: External URL links
 */
export function createLinkBtn(
  options: LinkButtonOptions
): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setURL(options.url)
    .setLabel(options.label)
    .setStyle(ButtonStyle.Link)

  if (options.emoji) button.setEmoji(options.emoji)
  if (options.disabled) button.setDisabled(options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button)
}

/**
 * @deprecated Use createSecondaryBtn instead
 * Legacy helper for backward compatibility
 */
export function createBackButton(
  customId: string,
  label: string = 'Back to Main Menu'
): ActionRowBuilder<ButtonBuilder> {
  return createSecondaryBtn({ customId, label, emoji: '◀️' })
}
