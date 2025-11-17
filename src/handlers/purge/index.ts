// Barrel export for purge handlers
export {
  showPurgeHub,
  handlePurgeTypeMenu,
  handlePurgeBackButton,
} from './main-hub'

// Parameter handlers
export {
  showAmountSelect,
  handleAmountSelect,
} from './parameters/amount-select'
export { showAmountModal, handleAmountModal } from './parameters/amount-modal'
export { showTokenModal, handleTokenModal } from './parameters/token-modal'
export { showUserSelect, handleUserSelect } from './parameters/user-select'
export {
  showChannelSelect,
  handleChannelSelect,
  handleUseCurrentChannel,
} from './parameters/channel-select'

// Preview and execute
export { showPurgePreview } from './preview'
export { handlePurgeConfirm, handlePurgeCancel } from './execute'

// Proceed handlers for default flow
export { handleProceedType } from './main-hub'
export { handleProceedChannel } from './parameters/channel-select'

// Default export for backward compatibility
import {
  showPurgeHub,
  handlePurgeTypeMenu,
  handlePurgeBackButton,
} from './main-hub'
import { handleAmountSelect } from './parameters/amount-select'
import { handleAmountModal } from './parameters/amount-modal'
import { handleTokenModal } from './parameters/token-modal'
import { handleUserSelect } from './parameters/user-select'
import {
  handleChannelSelect,
  handleUseCurrentChannel,
} from './parameters/channel-select'
import { handlePurgeConfirm, handlePurgeCancel } from './execute'
import { handleProceedType } from './main-hub'
import { handleProceedChannel } from './parameters/channel-select'

export default {
  showPurgeHub,
  handlePurgeTypeMenu,
  handlePurgeBackButton,
  handleAmountSelect,
  handleAmountModal,
  handleTokenModal,
  handleUserSelect,
  handleChannelSelect,
  handleUseCurrentChannel,
  handlePurgeConfirm,
  handlePurgeCancel,
  handleProceedType,
  handleProceedChannel,
}
