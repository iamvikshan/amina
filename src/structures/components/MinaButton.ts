// @root/src/structures/components/MinaButton.ts
// Centralized button factory extending ButtonBuilder with mina's styling

import { ButtonBuilder, ButtonStyle } from 'discord.js'

/**
 * Build custom_id with state (local utility to avoid circular imports)
 */
function buildCustomId(
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
 * MinaButton - Styled button factory extending ButtonBuilder
 *
 * Usage:
 *   MinaButton.prev('my:btn:prev', true)  // disabled prev button
 *   MinaButton.hub()                       // default hub button
 *   MinaButton.custom('id', 'label', ButtonStyle.Primary)
 */
export class MinaButton extends ButtonBuilder {
  constructor() {
    super()
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

  static withState(
    base: string,
    label: string,
    style: ButtonStyle,
    state: Record<string, string | number>
  ): MinaButton {
    return new MinaButton()
      .setCustomId(buildCustomId(base, state))
      .setLabel(label)
      .setStyle(style)
  }
}
