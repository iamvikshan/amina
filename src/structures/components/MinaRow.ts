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

  /** Confirm/Cancel (yeah | nah) */
  static confirmCancel(): MinaRow {
    return new MinaRow().addComponents(MinaButton.yeah(), MinaButton.nah())
  }

  /** Yes/No alias */
  static yesNo(): MinaRow {
    return MinaRow.confirmCancel()
  }

  // ============================================
  // NAVIGATION
  // ============================================

  /** Navigation with hub (prev | hub | next) */
  static navigation(
    hasPrev = true,
    hasNext = true,
    customIds?: { prev?: string; hub?: string; next?: string }
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

  /** Simple prev/next with disabled states */
  static prevNext(
    customIds?: { prev?: string; next?: string },
    disabledStates?: { prev?: boolean; next?: boolean }
  ): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.prev(customIds?.prev || 'prev', disabledStates?.prev ?? false),
      MinaButton.next(customIds?.next || 'next', disabledStates?.next ?? false)
    )
  }

  /** Pagination row - auto-handles disabled states based on page/total */
  static pagination(
    currentPage: number,
    totalPages: number,
    customIds?: { prev?: string; next?: string }
  ): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.prev(customIds?.prev || 'previousBtn', currentPage === 0),
      MinaButton.next(
        customIds?.next || 'nextBtn',
        currentPage >= totalPages - 1
      )
    )
  }

  /** Back and hub */
  static backHub(customIds?: { back?: string; hub?: string }): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.back(customIds?.back || 'back'),
      MinaButton.hub(customIds?.hub || 'hub')
    )
  }

  // ============================================
  // SPECIAL
  // ============================================

  /** Truth or Dare */
  static truthOrDare(customIds?: {
    truth?: string
    dare?: string
    random?: string
  }): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.truth(customIds?.truth || 'tod:truth'),
      MinaButton.dare(customIds?.dare || 'tod:dare'),
      MinaButton.random(customIds?.random || 'tod:random')
    )
  }

  /** Music controls */
  static musicControls(): MinaRow {
    return new MinaRow().addComponents(
      MinaButton.prev('music:prev'),
      MinaButton.custom('music:playpause', 'play/pause', ButtonStyle.Primary),
      MinaButton.next('music:next'),
      MinaButton.stop('music:stop')
    )
  }

  /** Ticket controls */
  static ticket(isOpen = true): MinaRow {
    return new MinaRow().addComponents(
      isOpen
        ? MinaButton.close('ticket:close')
        : MinaButton.open('ticket:open'),
      MinaButton.claim('ticket:claim')
    )
  }

  // ============================================
  // UTILITY
  // ============================================

  /** Single button row */
  static single(button: MinaButton): MinaRow {
    return new MinaRow().addComponents(button)
  }

  /** Custom row from buttons */
  static of(...buttons: MinaButton[]): MinaRow {
    return new MinaRow().addComponents(...buttons)
  }

  /** Link buttons row */
  static links(links: Array<{ url: string; label: string }>): MinaRow {
    return new MinaRow().addComponents(
      ...links.map(l => MinaButton.link(l.url, l.label))
    )
  }

  /**
   * Single back button as row
   * @example MinaRow.backRow('dev:btn:back_tod')
   */
  static backRow(customId: string): MinaRow {
    return new MinaRow().addComponents(MinaButton.back(customId))
  }

  /**
   * Single hub button as row
   * @example MinaRow.hubRow('profile:btn:hub')
   */
  static hubRow(customId: string): MinaRow {
    return new MinaRow().addComponents(MinaButton.hub(customId))
  }
}
