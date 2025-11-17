// Barrel export for dev handlers
export { showDevHub, handleCategoryMenu, handleDevBackButton } from './main-hub'
export {
  showTodMenu,
  handleTodMenu,
  showAddTodModal,
  handleAddTodModal,
  showRemoveTodModal,
  handleRemoveTodModal,
} from './tod'
export {
  showReloadMenu,
  handleReloadType,
  registerReloadAutocomplete,
} from './reload'
export {
  showTrigSettings,
  handleTrigSettingsChannelSelect,
  handleTrigSettingsConfirm,
} from './trig-settings'
export { showListservers } from './listservers'
export {
  showPresenceMenu,
  showPresenceModal,
  handlePresenceModal,
  handlePresenceTypeMenu,
  handlePresenceStatusMenu,
  handlePresenceConfirm,
} from './presence'
export {
  showMinaAiMenu,
  handleMinaAiMenu,
  handleMinaAiOperation,
  handleMinaAiToggle,
  handleMinaAiModal,
} from './minaai'

// Default export for backward compatibility
import { showDevHub, handleCategoryMenu, handleDevBackButton } from './main-hub'
import { handleReloadType } from './reload'
import {
  handleTrigSettingsChannelSelect,
  handleTrigSettingsConfirm,
} from './trig-settings'
import {
  handlePresenceModal,
  handlePresenceTypeMenu,
  handlePresenceStatusMenu,
  handlePresenceConfirm,
  showPresenceModal,
} from './presence'
import {
  handleMinaAiMenu,
  handleMinaAiToggle,
  handleMinaAiModal,
} from './minaai'
import { handleTodMenu, handleAddTodModal, handleRemoveTodModal } from './tod'

export default {
  showDevHub,
  handleCategoryMenu,
  handleDevBackButton,
  handleReloadType,
  handleTrigSettingsChannelSelect,
  handleTrigSettingsConfirm,
  handlePresenceModal,
  handlePresenceTypeMenu,
  handlePresenceStatusMenu,
  handlePresenceConfirm,
  showPresenceModal,
  handleMinaAiMenu,
  handleMinaAiToggle,
  handleMinaAiModal,
  handleTodMenu,
  handleAddTodModal,
  handleRemoveTodModal,
}
