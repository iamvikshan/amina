// Barrel export for profile handlers
export * from './main-hub'
export * from './edit'
export * from './privacy'
export * from './clear'
export * from './view'

// Legacy exports for backward compatibility
export { handleProfileClear as handleProfileClearLegacy } from './clear'
