// Barrel export for minaai handlers
import {
  showMinaAiHub,
  handleMinaAiOperationMenu,
  handleMinaAiBackButton,
} from './main-hub'
import {
  showMemoriesView,
  showCategoryDetailView,
  handleCategoryPage,
  handleBackToMemories,
  handleDmMe,
} from './memories'
import {
  showForgetMeConfirmation,
  handleForgetMeConfirm,
  handleForgetMeCancel,
} from './forget-me'
import { showSettings, handleSettingsMenu } from './settings'

// Re-export for named imports
export {
  showMinaAiHub,
  handleMinaAiOperationMenu,
  handleMinaAiBackButton,
  showMemoriesView,
  showCategoryDetailView,
  handleCategoryPage,
  handleBackToMemories,
  handleDmMe,
  showForgetMeConfirmation,
  handleForgetMeConfirm,
  handleForgetMeCancel,
  showSettings,
  handleSettingsMenu,
}

// Default export for consistency with other handlers
const minaaiHandler = {
  showMinaAiHub,
  handleMinaAiOperationMenu,
  handleMinaAiBackButton,
  showMemoriesView,
  showCategoryDetailView,
  handleCategoryPage,
  handleBackToMemories,
  handleDmMe,
  showForgetMeConfirmation,
  handleForgetMeConfirm,
  handleForgetMeCancel,
  showSettings,
  handleSettingsMenu,
}

export default minaaiHandler
