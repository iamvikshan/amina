// Barrel export for roles handlers
export { handleRolesOperationMenu, handleRolesBackButton } from './main-hub'
export {
  showCleanupMethodMenu,
  handleCleanupMethodMenu,
} from './cleanup/method-select'
export {
  handleCleanupModal,
  handleRoleKeepSelect,
  handleContinueButton,
} from './cleanup/parameter-handlers'
export { showCleanupPreview } from './cleanup/preview'
export { handleCleanupConfirm, handleCleanupCancel } from './cleanup/execute'
export {
  showAutoroleMenu,
  handleAutoroleEnableButton,
  handleAutoroleRoleSelect,
  handleAutoroleDisableButton,
  handleAutoroleDisableConfirm,
  handleAutoroleCancel,
} from './autorole'
export {
  showCreateRoleMenu,
  handleCreateRoleModal,
  handlePermissionSelect,
} from './create'
export {
  showAddToUserMenu,
  handleUserSelect,
  handleRoleSelect,
  handleAssignConfirm,
} from './add-to-user'

// Default export for backward compatibility
import { handleRolesOperationMenu, handleRolesBackButton } from './main-hub'
import { handleCleanupMethodMenu } from './cleanup/method-select'
import {
  handleCleanupModal,
  handleRoleKeepSelect,
  handleContinueButton,
} from './cleanup/parameter-handlers'
import { handleCleanupConfirm, handleCleanupCancel } from './cleanup/execute'
import {
  handleAutoroleEnableButton,
  handleAutoroleRoleSelect,
  handleAutoroleDisableButton,
  handleAutoroleDisableConfirm,
  handleAutoroleCancel,
} from './autorole'
import { handleCreateRoleModal, handlePermissionSelect } from './create'
import {
  handleUserSelect,
  handleRoleSelect,
  handleAssignConfirm,
} from './add-to-user'

export default {
  handleRolesOperationMenu,
  handleRolesBackButton,
  handleCleanupMethodMenu,
  handleCleanupModal,
  handleRoleKeepSelect,
  handleContinueButton,
  handleCleanupConfirm,
  handleCleanupCancel,
  handleAutoroleEnableButton,
  handleAutoroleRoleSelect,
  handleAutoroleDisableButton,
  handleAutoroleDisableConfirm,
  handleAutoroleCancel,
  handleCreateRoleModal,
  handlePermissionSelect,
  handleUserSelect,
  handleRoleSelect,
  handleAssignConfirm,
}
