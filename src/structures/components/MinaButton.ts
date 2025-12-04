// @root/src/structures/components/MinaButton.ts
// Centralized button factory extending ButtonBuilder with mina's styling

import { ButtonBuilder, ButtonStyle } from 'discord.js'

/**
 * Parse state from customId created by buildCustomId
 * @param customId - The customId to parse (format: base|key1:value1|key2:value2)
 * @returns Object with parsed state, converting numeric strings to numbers
 * @example
 * parseState('btn:page|page:2|size:10') // { page: 2, size: 10 }
 * parseState('btn:action|action:delete') // { action: 'delete' }
 * parseState('simple') // {}
 */
export function parseState(customId: string): Record<string, string | number> {
  const pipeIndex = customId.indexOf('|')
  if (pipeIndex === -1) {
    return {}
  }

  const statePart = customId.slice(pipeIndex + 1)
  if (!statePart) {
    return {}
  }

  return statePart.split('|').reduce(
    (acc, pair) => {
      const [key, value] = pair.split(':')
      if (!key || value === undefined) {
        return acc
      }

      // Convert numeric strings to numbers
      const parsedValue = /^\d+$/.test(value) ? parseInt(value, 10) : value
      acc[key] = parsedValue
      return acc
    },
    {} as Record<string, string | number>
  )
}

/**
 * MinaButton - Styled button factory extending ButtonBuilder
 *
 * Usage:
 *   MinaButton.prev('my:btn:prev', true)  // disabled prev button
 *   MinaButton.hub()                       // default hub button
 *   MinaButton.custom('id', 'label', ButtonStyle.Primary)
 */
export class MinaButton extends ButtonBuilder {
  /**
   * Build custom_id with state (local utility to avoid circular imports)
   * Format: base|key1:value1|key2:value2
   */
  private static buildCustomId(
    base: string,
    state?: Record<string, string | number>
  ): string {
    if (!state || Object.keys(state).length === 0) {
      return base
    }

    // Validate no delimiters in values
    for (const [key, value] of Object.entries(state)) {
      const strVal = String(value)
      if (
        strVal.includes('|') ||
        strVal.includes(':') ||
        key.includes('|') ||
        key.includes(':')
      ) {
        throw new Error(
          `State key/value cannot contain '|' or ':': ${key}=${value}`
        )
      }
    }

    const stateParts = Object.entries(state).map(
      ([key, value]) => `${key}:${value}`
    )
    const customId = `${base}|${stateParts.join('|')}`
    if (customId.length > 100) {
      throw new Error(`custom_id exceeds 100 characters: ${customId.length}`)
    }
    return customId
  }

  // ============================================
  // CONFIRMATION
  // ============================================

  static yeah(customId = 'confirm'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('yeah')
      .setStyle(ButtonStyle.Success)
  }

  static nah(customId = 'cancel'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('nah')
      .setStyle(ButtonStyle.Secondary)
  }

  static sure(customId = 'confirm'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('sure')
      .setStyle(ButtonStyle.Success)
  }

  // ============================================
  // NAVIGATION
  // ============================================

  static prev(customId = 'prev', disabled = false): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  }

  static next(customId = 'next', disabled = false): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  }

  static back(customId = 'back'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('back')
      .setStyle(ButtonStyle.Secondary)
  }

  static hub(customId = 'hub'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('hub')
      .setStyle(ButtonStyle.Primary)
  }

  static home(customId = 'home'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('home')
      .setStyle(ButtonStyle.Primary)
  }

  // ============================================
  // ACTIONS
  // ============================================

  static go(customId: string): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('go')
      .setStyle(ButtonStyle.Success)
  }

  static done(customId = 'done'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('done')
      .setStyle(ButtonStyle.Success)
  }

  static skip(customId = 'skip'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('skip')
      .setStyle(ButtonStyle.Secondary)
  }

  static stop(customId = 'stop'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('stop')
      .setStyle(ButtonStyle.Danger)
  }

  static retry(customId = 'retry'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('retry')
      .setStyle(ButtonStyle.Primary)
  }

  static refresh(customId = 'refresh'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('refresh')
      .setStyle(ButtonStyle.Secondary)
  }

  // ============================================
  // DANGER
  // ============================================

  static delete(customId = 'delete'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('delete')
      .setStyle(ButtonStyle.Danger)
  }

  static remove(customId = 'remove'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('remove')
      .setStyle(ButtonStyle.Danger)
  }

  static ban(customId = 'ban'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('ban')
      .setStyle(ButtonStyle.Danger)
  }

  static kick(customId = 'kick'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('kick')
      .setStyle(ButtonStyle.Danger)
  }

  // ============================================
  // TOGGLE
  // ============================================

  static on(customId = 'toggle_on'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('on')
      .setStyle(ButtonStyle.Success)
  }

  static off(customId = 'toggle_off'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('off')
      .setStyle(ButtonStyle.Secondary)
  }

  // ============================================
  // SPECIAL
  // ============================================

  static truth(customId = 'truth'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('truth')
      .setStyle(ButtonStyle.Primary)
  }

  static dare(customId = 'dare'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('dare')
      .setStyle(ButtonStyle.Danger)
  }

  static random(customId = 'random'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('random')
      .setStyle(ButtonStyle.Secondary)
  }

  static join(customId = 'join'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('join')
      .setStyle(ButtonStyle.Success)
  }

  static leave(customId = 'leave'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('leave')
      .setStyle(ButtonStyle.Secondary)
  }

  static claim(customId = 'claim'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('claim')
      .setStyle(ButtonStyle.Success)
  }

  static close(customId = 'close'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('close')
      .setStyle(ButtonStyle.Danger)
  }

  static open(customId = 'open'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('open')
      .setStyle(ButtonStyle.Success)
  }

  // ============================================
  // MUSIC
  // ============================================

  static play(customId = 'play'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('play')
      .setStyle(ButtonStyle.Success)
  }

  static pause(customId = 'pause'): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel('pause')
      .setStyle(ButtonStyle.Secondary)
  }

  // ============================================
  // LINKS
  // ============================================

  static link(url: string, label = 'link'): MinaButton {
    return new MinaButton()
      .setURL(url)
      .setLabel(label)
      .setStyle(ButtonStyle.Link)
  }

  static invite(url: string): MinaButton {
    return new MinaButton()
      .setURL(url)
      .setLabel('invite')
      .setStyle(ButtonStyle.Link)
  }

  static support(url: string): MinaButton {
    return new MinaButton()
      .setURL(url)
      .setLabel('support')
      .setStyle(ButtonStyle.Link)
  }

  static docs(url: string): MinaButton {
    return new MinaButton()
      .setURL(url)
      .setLabel('docs')
      .setStyle(ButtonStyle.Link)
  }

  // ============================================
  // CUSTOM BUILDERS
  // ============================================

  static custom(
    customId: string,
    label: string,
    style: ButtonStyle = ButtonStyle.Secondary,
    disabled = false
  ): MinaButton {
    return new MinaButton()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style)
      .setDisabled(disabled)
  }

  /**
   * Create button with embedded state
   * @param base - Base customId without state
   * @param label - Button label
   * @param style - Button style
   * @param state - State object to encode (format: {key: value} where value is string or number)
   * @returns MinaButton with encoded customId
   * @example
   * MinaButton.withState('btn:page', 'Next', ButtonStyle.Primary, {page: 2, size: 10})
   * // Creates button with customId: "btn:page|page:2|size:10"
   *
   * // Parse state back using:
   * import { parseState } from './MinaButton'
   * const state = parseState(interaction.customId) // {page: 2, size: 10}
   */
  static withState(
    base: string,
    label: string,
    style: ButtonStyle,
    state: Record<string, string | number>
  ): MinaButton {
    return new MinaButton()
      .setCustomId(MinaButton.buildCustomId(base, state))
      .setLabel(label)
      .setStyle(style)
  }
}
