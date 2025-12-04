// Barrel export for ticket handlers
export {
  showTicketHub,
  handleTicketCategoryMenu,
  handleTicketBackButton,
} from './main-hub'

// Setup handlers
export { showSetupMenu, handleSetupMenu } from './setup/menu'
export {
  showMessageChannelSelect,
  handleMessageChannelSelect,
  handleTicketMessageModal,
} from './setup/message'
export {
  showLogChannelSelect,
  handleLogChannelSelect,
} from './setup/log-channel'
export { showLimitModal, handleLimitModal } from './setup/limit'
export {
  showTopicsMenu,
  handleTopicsMenu,
  handleAddTopicModal,
  handleRemoveTopicSelect,
  handleRemoveTopicConfirm,
  handleRemoveTopicCancel,
  handleBackToTopics,
} from './setup/topics'

// Manage handlers
export { showManageMenu, handleManageMenu } from './manage/menu'
export { handleCloseTicket } from './manage/close'
export {
  showCloseAllConfirmation,
  handleCloseAllConfirm,
  handleCloseAllCancel,
} from './manage/closeAll'
export { showAddUserSelect, handleAddUserSelect } from './manage/addUser'
export {
  showRemoveUserSelect,
  handleRemoveUserSelect,
} from './manage/removeUser'

// Shared utilities
export {
  isTicketChannel,
  getTicketChannels,
  getExistingTicketChannel,
  parseTicketDetails,
  closeTicket,
  closeAllTickets,
} from './shared/utils'

// Button handlers
export {
  handleTicketOpen,
  handleTicketClose,
  handleTicketDelete,
} from './shared/buttons'

// Default export for backward compatibility
import { showTicketHub } from './main-hub'
import {
  isTicketChannel,
  getTicketChannels,
  getExistingTicketChannel,
  closeTicket,
  closeAllTickets,
} from './shared/utils'
import {
  handleTicketOpen,
  handleTicketClose,
  handleTicketDelete,
} from './shared/buttons'

export default {
  showTicketHub,
  isTicketChannel,
  getTicketChannels,
  getExistingTicketChannel,
  closeTicket,
  closeAllTickets,
  handleTicketOpen,
  handleTicketClose,
  handleTicketDelete,
}
