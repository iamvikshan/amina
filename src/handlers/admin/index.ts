// Barrel export for admin handlers
export { handleAdminCategoryMenu, handleAdminBackButton } from './main-hub'
export { showServerSettingsMenu, handleServerSettingsMenu } from './settings'
export {
  showMinaAIMenu,
  handleMinaAIMenu,
  handleRemoveFreeWillChannel,
} from './ai'
export {
  showLoggingMenu,
  showLoggingMenuDirect,
  handleLoggingMenu,
  handleLoggingPageButton,
  handleBackToLogs,
} from './logging'
export { handleChannelSelect } from './shared/channel-select'
export { handleRoleSelect } from './shared/role-select'

// Default export for backward compatibility
import { handleAdminCategoryMenu, handleAdminBackButton } from './main-hub'
import { handleServerSettingsMenu } from './settings'
import { handleMinaAIMenu } from './ai'
import { handleLoggingMenu } from './logging'
import { handleChannelSelect } from './shared/channel-select'
import { handleRoleSelect } from './shared/role-select'

export default {
  handleAdminCategoryMenu,
  handleServerSettingsMenu,
  handleMinaAIMenu,
  handleLoggingMenu,
  handleChannelSelect,
  handleRoleSelect,
  handleAdminBackButton,
}
