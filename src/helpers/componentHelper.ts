import {
  Message,
  ComponentType,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  MessageComponentInteraction,
} from 'discord.js'
import { Logger } from '@helpers/Logger'

// Re-export component classes for backward compatibility
// New code should import directly from '@structures/components'
export { MinaButton, MinaRow, MinaSelect } from '@structures/components'

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
  } catch (_err) {
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
    Logger.error('Failed to disable components', err)
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

// ============================================
// LEGACY EXPORTS - Deprecated, use class methods instead
// Keeping for backward compatibility during migration
// ============================================

import { MinaButton, MinaRow, MinaSelect } from '@structures/components'

/** @deprecated Use MinaButton static methods instead */
export const MinaButtons = {
  yeah: MinaButton.yeah,
  nah: MinaButton.nah,
  sure: MinaButton.sure,
  prev: MinaButton.prev,
  next: MinaButton.next,
  back: MinaButton.back,
  hub: MinaButton.hub,
  home: MinaButton.home,
  go: MinaButton.go,
  done: MinaButton.done,
  skip: MinaButton.skip,
  stop: MinaButton.stop,
  retry: MinaButton.retry,
  refresh: MinaButton.refresh,
  delete: MinaButton.delete,
  remove: MinaButton.remove,
  ban: MinaButton.ban,
  kick: MinaButton.kick,
  on: MinaButton.on,
  off: MinaButton.off,
  truth: MinaButton.truth,
  dare: MinaButton.dare,
  random: MinaButton.random,
  join: MinaButton.join,
  leave: MinaButton.leave,
  claim: MinaButton.claim,
  close: MinaButton.close,
  open: MinaButton.open,
  play: MinaButton.play,
  pause: MinaButton.pause,
  link: MinaButton.link,
  invite: MinaButton.invite,
  support: MinaButton.support,
  docs: MinaButton.docs,
  custom: MinaButton.custom,
  withState: MinaButton.withState,
}

/** @deprecated Use MinaRow static methods instead */
export const MinaRows = {
  confirmCancel: MinaRow.confirmCancel,
  yesNo: MinaRow.yesNo,
  navigation: MinaRow.navigation,
  prevNext: MinaRow.prevNext,
  pagination: MinaRow.pagination,
  backHub: MinaRow.backHub,
  truthOrDare: MinaRow.truthOrDare,
  musicControls: MinaRow.musicControls,
  ticket: MinaRow.ticket,
  single: MinaRow.single,
  from: MinaRow.of, // from -> of rename
  links: MinaRow.links,
  backRow: MinaRow.backRow,
  hubRow: MinaRow.hubRow,
}

/** @deprecated Use MinaSelect static methods instead */
export const MinaSelects = {
  string: MinaSelect.create,
  row: MinaSelect.wrapInRow,
}
