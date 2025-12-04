// Barrel export for reminder handlers
import {
  showReminderHub,
  handleReminderOperationMenu,
  handleReminderBackButton,
} from './main-hub'
import {
  showRemindersList,
  handleReminderPage,
  handleDeleteReminderMenu,
  handleEditReminderMenu,
} from './list'
import { handleAddReminder } from './add'
import {
  showEditReminder,
  handleEditActionMenu,
  handleEditMessageModal,
  handleEditTimeModal,
} from './edit'
import {
  showClearConfirmation,
  handleClearConfirm,
  handleClearCancel,
} from './clear'

// Re-export for named imports
export {
  showReminderHub,
  handleReminderOperationMenu,
  handleReminderBackButton,
  showRemindersList,
  handleReminderPage,
  handleDeleteReminderMenu,
  handleEditReminderMenu,
  handleAddReminder,
  showEditReminder,
  handleEditActionMenu,
  handleEditMessageModal,
  handleEditTimeModal,
  showClearConfirmation,
  handleClearConfirm,
  handleClearCancel,
}

// Default export for consistency with other handlers
const reminderHandler = {
  showReminderHub,
  handleReminderOperationMenu,
  handleReminderBackButton,
  showRemindersList,
  handleReminderPage,
  handleDeleteReminderMenu,
  handleEditReminderMenu,
  handleAddReminder,
  showEditReminder,
  handleEditActionMenu,
  handleEditMessageModal,
  handleEditTimeModal,
  showClearConfirmation,
  handleClearConfirm,
  handleClearCancel,
}

export default reminderHandler
