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
export { showReloadMenu, handleReloadType } from './reload'
export {
  showTrigSettings,
  handleTrigSettingsChannelSelect,
  handleTrigSettingsConfirm,
} from './trig-settings'
export { showListservers, handleListserversPage } from './listservers'
export { showLeaveServerModal, handleLeaveServerModal } from './leaveserver'
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
import { handleListserversPage } from './listservers'
import { handleLeaveServerModal } from './leaveserver'

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
  handleListserversPage,
  handleLeaveServerModal,
}
