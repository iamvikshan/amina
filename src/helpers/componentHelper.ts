import {
  Message,
  ComponentType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
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

// ============================================
// MINA BUTTON PRESETS
// Short, lowercase labels - mina's style
// Returns ButtonBuilder (not ActionRow) for flexibility
// ============================================

export const MinaButtons = {
  // Confirmation
  yeah: (customId = 'confirm') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('yeah')
      .setStyle(ButtonStyle.Success),

  nah: (customId = 'cancel') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('nah')
      .setStyle(ButtonStyle.Secondary),

  sure: (customId = 'confirm') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('sure')
      .setStyle(ButtonStyle.Success),

  // Navigation
  prev: (customId = 'prev', disabled = false) =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),

  next: (customId = 'next', disabled = false) =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),

  back: (customId = 'back') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('back')
      .setStyle(ButtonStyle.Secondary),

  hub: (customId = 'hub') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('hub')
      .setStyle(ButtonStyle.Primary),

  home: (customId = 'home') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('home')
      .setStyle(ButtonStyle.Primary),

  // Actions
  go: (customId: string) =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('go')
      .setStyle(ButtonStyle.Success),

  done: (customId = 'done') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('done')
      .setStyle(ButtonStyle.Success),

  skip: (customId = 'skip') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('skip')
      .setStyle(ButtonStyle.Secondary),

  stop: (customId = 'stop') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('stop')
      .setStyle(ButtonStyle.Danger),

  retry: (customId = 'retry') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('retry')
      .setStyle(ButtonStyle.Primary),

  refresh: (customId = 'refresh') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('refresh')
      .setStyle(ButtonStyle.Secondary),

  // Danger
  delete: (customId = 'delete') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('delete')
      .setStyle(ButtonStyle.Danger),

  remove: (customId = 'remove') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('remove')
      .setStyle(ButtonStyle.Danger),

  ban: (customId = 'ban') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('ban')
      .setStyle(ButtonStyle.Danger),

  kick: (customId = 'kick') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('kick')
      .setStyle(ButtonStyle.Danger),

  // Toggle
  on: (customId = 'toggle_on') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('on')
      .setStyle(ButtonStyle.Success),

  off: (customId = 'toggle_off') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('off')
      .setStyle(ButtonStyle.Secondary),

  // Special
  truth: (customId = 'truth') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('truth')
      .setStyle(ButtonStyle.Primary),

  dare: (customId = 'dare') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('dare')
      .setStyle(ButtonStyle.Danger),

  random: (customId = 'random') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('random')
      .setStyle(ButtonStyle.Secondary),

  join: (customId = 'join') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('join')
      .setStyle(ButtonStyle.Success),

  leave: (customId = 'leave') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('leave')
      .setStyle(ButtonStyle.Secondary),

  claim: (customId = 'claim') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('claim')
      .setStyle(ButtonStyle.Success),

  close: (customId = 'close') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('close')
      .setStyle(ButtonStyle.Danger),

  open: (customId = 'open') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('open')
      .setStyle(ButtonStyle.Success),

  // Music
  play: (customId = 'play') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('play')
      .setStyle(ButtonStyle.Success),

  pause: (customId = 'pause') =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('pause')
      .setStyle(ButtonStyle.Secondary),

  // Links
  link: (url: string, label = 'link') =>
    new ButtonBuilder().setURL(url).setLabel(label).setStyle(ButtonStyle.Link),

  invite: (url: string) =>
    new ButtonBuilder()
      .setURL(url)
      .setLabel('invite')
      .setStyle(ButtonStyle.Link),

  support: (url: string) =>
    new ButtonBuilder()
      .setURL(url)
      .setLabel('support')
      .setStyle(ButtonStyle.Link),

  docs: (url: string) =>
    new ButtonBuilder().setURL(url).setLabel('docs').setStyle(ButtonStyle.Link),

  // Custom builders
  custom: (
    customId: string,
    label: string,
    style: ButtonStyle = ButtonStyle.Secondary,
    disabled = false
  ) =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style)
      .setDisabled(disabled),

  withState: (
    base: string,
    label: string,
    style: ButtonStyle,
    state: Record<string, string | number>
  ) =>
    new ButtonBuilder()
      .setCustomId(buildCustomId(base, state))
      .setLabel(label)
      .setStyle(style),
}

// ============================================
// MINA ROW PRESETS
// Pre-built ActionRows for common patterns
// ============================================

export const MinaRows = {
  /** Confirm/Cancel (yeah | nah) */
  confirmCancel: () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.yeah(),
      MinaButtons.nah()
    ),

  /** Yes/No alias */
  yesNo: () => MinaRows.confirmCancel(),

  /** Navigation with hub (prev | hub | next) */
  navigation: (
    hasPrev = true,
    hasNext = true,
    customIds?: { prev?: string; hub?: string; next?: string }
  ) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...([
        hasPrev && MinaButtons.prev(customIds?.prev || 'prev', !hasPrev),
        MinaButtons.hub(customIds?.hub || 'hub'),
        hasNext && MinaButtons.next(customIds?.next || 'next', !hasNext),
      ].filter(Boolean) as ButtonBuilder[])
    ),

  /** Simple prev/next */
  prevNext: (hasPrev = true, hasNext = true) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.prev('prev', !hasPrev),
      MinaButtons.next('next', !hasNext)
    ),

  /** Back and hub */
  backHub: (customIds?: { back?: string; hub?: string }) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.back(customIds?.back || 'back'),
      MinaButtons.hub(customIds?.hub || 'hub')
    ),

  /** Truth or Dare */
  truthOrDare: (customIds?: {
    truth?: string
    dare?: string
    random?: string
  }) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.truth(customIds?.truth || 'tod:truth'),
      MinaButtons.dare(customIds?.dare || 'tod:dare'),
      MinaButtons.random(customIds?.random || 'tod:random')
    ),

  /** Music controls */
  musicControls: () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.prev('music:prev'),
      MinaButtons.custom('music:playpause', 'play/pause', ButtonStyle.Primary),
      MinaButtons.next('music:next'),
      MinaButtons.stop('music:stop')
    ),

  /** Ticket controls */
  ticket: (isOpen = true) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      isOpen
        ? MinaButtons.close('ticket:close')
        : MinaButtons.open('ticket:open'),
      MinaButtons.claim('ticket:claim')
    ),

  /** Single button row */
  single: (button: ButtonBuilder) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(button),

  /** Custom row from buttons */
  from: (...buttons: ButtonBuilder[]) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons),

  /** Link buttons row */
  links: (links: Array<{ url: string; label: string }>) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...links.map(l => MinaButtons.link(l.url, l.label))
    ),

  /**
   * Single back button as row (drop-in replacement for createSecondaryBtn back button)
   * @example MinaRows.backRow('dev:btn:back_tod') // Returns ActionRow with single "back" button
   */
  backRow: (customId: string) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.back(customId)
    ),

  /**
   * Single hub button as row
   * @example MinaRows.hubRow('profile:btn:hub') // Returns ActionRow with single "hub" button
   */
  hubRow: (customId: string) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      MinaButtons.hub(customId)
    ),
}

// ============================================
// MINA SELECT MENUS
// ============================================

export const MinaSelects = {
  /** Create a string select menu */
  string: (
    customId: string,
    placeholder: string,
    options: Array<{
      label: string
      value: string
      description?: string
      default?: boolean
    }>
  ) => {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)

    const selectOptions = options.map(opt => {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(opt.label)
        .setValue(opt.value)
      if (opt.description) option.setDescription(opt.description)
      if (opt.default) option.setDefault(opt.default)
      return option
    })

    menu.addOptions(selectOptions)
    return menu
  },

  /** Wrap select menu in action row */
  row: (menu: StringSelectMenuBuilder) =>
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
}
