/**
 * Barrel export file for structure classes
 * Re-exports all core bot structures for convenient importing
 */

import BotClient from './BotClient'
import Command from './Command'
import CommandCategory from './CommandCategory'
import BaseContext from './BaseContext'

// Named exports
export { BaseContext, BotClient, Command, CommandCategory }

// Default export for backwards compatibility
export default {
  BaseContext,
  BotClient,
  Command,
  CommandCategory,
}
