// @root/src/structures/components/MinaRow.ts
// Centralized action row factory extending ActionRowBuilder with mina's presets

import { ActionRowBuilder, ButtonStyle } from 'discord.js'
import { MinaButton } from './MinaButton'

/**
 * MinaRow - Styled action row factory extending ActionRowBuilder
 *
 * Usage:
 *   MinaRow.confirmCancel()                    // yeah | nah
 *   MinaRow.pagination(0, 5)                   // prev (disabled) | next
 *   MinaRow.backRow('admin:btn:back')          // single back button
 */
export class MinaRow extends ActionRowBuilder<MinaButton> {
  constructor() {
    super()
  }

  // ============================================
  // CONFIRMATION
  // ============================================

  /**
   * Confirm/Cancel (yeah | nah)
   * @returns {MinaRow} The result.
   */
  static confirmCancel(): MinaRow {
    return new MinaRow().addComponents(MinaButton.yeah(), MinaButton.nah())
  }

  /**
   * Yes/No alias
   * @returns {MinaRow} The result.
   */
  static yesNo(): MinaRow {
    return MinaRow.confirmCancel()
  }

  // ============================================
  // NAVIGATION
  // ============================================

  /**
   * Navigation with hub (prev | hub | next)
   * @param {boolean} hasPrev - The has prev
   * @param {boolean} hasNext - The has next
   * @param {Array} customIds - The custom ids
   * @param {Object} customIds.prev - The custom ids.prev
   * @param {Object} customIds.hub - The custom ids.hub
   * @param {Object} customIds.next - The custom ids.next
   * @returns {void} Nothing.
   */
  static navigation(
    hasPrev = true,
    hasNext = true,
    customIds?: { prev?: string; hub?: string; next?: string },
  ): MinaRow {
    const buttons: MinaButton[] = []

    if (hasPrev) {
      buttons.push(MinaButton.prev(customIds?.prev || 'prev', false))
    }
    buttons.push(MinaButton.hub(customIds?.hub || 'hub'))
    if (hasNext) {
      buttons.push(MinaButton.next(customIds?.next || 'next', false))
    }

    return new MinaRow().addComponents(...buttons)
  }

  /**
   * Simple prev/next with disabled states
   * @param {Array} customIds - The custom ids
   * @param {Object} customIds.prev - The custom ids.prev
   * @param {Object} customIds.next - The custom ids.next
   * @param {Array} disabledStates - The disabled states
   * @param {Object} disabledStates.prev - The disabled states.prev
   * @param {Object} disabledStates.next - The disabled states.next
   * @returns {void} Nothing.
   */
  static prevNext(
    customIds?: { prev?: string; next?: string },
    disabledStates?: { prev?: boolean; next?: boolean },
  ): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.prev(customIds?.prev || 'prev', disabledStates?.prev ?? false),
      MinaButton.next(customIds?.next || 'next', disabledStates?.next ?? false),
    )
  }

  /**
   * Pagination row - auto-handles disabled states based on page/total
   * @param {number} currentPage - The current page
   * @param {number} totalPages - The total pages
   * @param {Array} customIds - The custom ids
   * @param {Object} customIds.prev - The custom ids.prev
   * @param {Object} customIds.next - The custom ids.next
   * @returns {void} Nothing.
   */
  static pagination(
    currentPage: number,
    totalPages: number,
    customIds?: { prev?: string; next?: string },
  ): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.prev(customIds?.prev || 'previousBtn', currentPage === 0),
      MinaButton.next(
        customIds?.next || 'nextBtn',
        currentPage >= totalPages - 1,
      ),
    )
  }

  /**
   * Back and hub
   * @param {Array} customIds - The custom ids
   * @param {Object} customIds.back - The custom ids.back
   * @param {Object} customIds.hub - The custom ids.hub
   * @returns {MinaRow} The result.
   */
  static backHub(customIds?: { back?: string; hub?: string }): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.back(customIds?.back || 'back'),
      MinaButton.hub(customIds?.hub || 'hub'),
    )
  }

  // ============================================
  // SPECIAL
  // ============================================

  /**
   * Truth or Dare
   * @param {Object} customIds - The custom ids
   * @param {Object} customIds.truth - The custom ids.truth
   * @param {Object} customIds.dare - The custom ids.dare
   * @param {Object} customIds.random - The custom ids.random
   * @returns {void} Nothing.
   */
  static truthOrDare(customIds?: {
    truth?: string
    dare?: string
    random?: string
  }): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.truth(customIds?.truth || 'tod:truth'),
      MinaButton.dare(customIds?.dare || 'tod:dare'),
      MinaButton.random(customIds?.random || 'tod:random'),
    )
  }

  /**
   * Music controls
   * @returns {MinaRow} The result.
   */
  static musicControls(): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.prev('music:prev'),
      MinaButton.custom('music:playpause', 'play/pause', ButtonStyle.Primary),
      MinaButton.next('music:next'),
      MinaButton.stop('music:stop'),
    )
  }

  /**
   * Ticket controls
   * @param {boolean} isOpen - The is open
   * @returns {MinaRow} The result.
   */
  static ticket(isOpen = true): MinaRow {
    return new MinaRow().addComponents(
      isOpen
        ? MinaButton.close('ticket:close')
        : MinaButton.open('ticket:open'),
      MinaButton.claim('ticket:claim'),
    )
  }

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Single button row
   * @param {MinaButton} button - The button component
   * @returns {MinaRow} The result.
   */
  static single(button: MinaButton): MinaRow {
    return new MinaRow().addComponents(button)
  }

  /**
   * Custom row from buttons
   * @param {MinaButton[} buttons - The buttons
   * @returns {MinaRow} The result.
   */
  static of(...buttons: MinaButton[]): MinaRow {
    return new MinaRow().addComponents(...buttons)
  }

  /**
   * Link buttons row
   * @param {Array} links - The links
   * @returns {MinaRow} The result.
   */
  static links(links: Array<{ url: string; label: string }>): MinaRow {
    return new MinaRow().addComponents(
      ...links.map(l => MinaButton.link(l.url, l.label)),
    )
  }

  /**
   * Single back button as row
   * @param {string} customId - The custom ID
   * @example MinaRow.backRow('dev:btn:back_tod')
   * @returns {MinaRow} The result.
   */
  static backRow(customId: string): MinaRow {
    return new MinaRow().addComponents(MinaButton.back(customId))
  }

  /**
   * Single hub button as row
   * @param {string} customId - The custom ID
   * @example MinaRow.hubRow('profile:btn:hub')
   * @returns {MinaRow} The result.
   */
  static hubRow(customId: string): MinaRow {
    return new MinaRow().addComponents(MinaButton.hub(customId))
  }
}
