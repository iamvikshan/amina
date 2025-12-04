// @root/src/structures/components/MinaSelect.ts
// Centralized select menu factory extending StringSelectMenuBuilder

import {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from 'discord.js'

/**
 * Option type for MinaSelect
 */
export interface MinaSelectOption {
  label: string
  value: string
  description?: string
  default?: boolean
}

/**
 * MinaSelect - Styled select menu factory extending StringSelectMenuBuilder
 *
 * Usage:
 *   MinaSelect.create('my:menu', 'choose something', [
 *     { label: 'option 1', value: 'opt1', description: 'first option' },
 *     { label: 'option 2', value: 'opt2' }
 *   ])
 *
 *   // Or wrap in a row directly
 *   MinaSelect.row('my:menu', 'choose something', options)
 */
export class MinaSelect extends StringSelectMenuBuilder {
  constructor() {
    super()
  }

  /**
   * Create a select menu with options
   */
  static create(
    customId: string,
    placeholder: string,
    options: MinaSelectOption[]
  ): MinaSelect {
    const menu = new MinaSelect()
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
  }

  /**
   * Create a select menu wrapped in an action row
   */
  static row(
    customId: string,
    placeholder: string,
    options: MinaSelectOption[]
  ): ActionRowBuilder<MinaSelect> {
    return new ActionRowBuilder<MinaSelect>().addComponents(
      MinaSelect.create(customId, placeholder, options)
    )
  }

  /**
   * Wrap an existing select menu in an action row
   */
  static wrapInRow(menu: MinaSelect): ActionRowBuilder<MinaSelect> {
    return new ActionRowBuilder<MinaSelect>().addComponents(menu)
  }
}
