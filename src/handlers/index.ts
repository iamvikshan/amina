// Barrel export for all handlers
// Using dynamic imports to maintain compatibility with both .js and .ts files

// Handlers with default exports - re-export the default
export { default as adminHandler } from './admin'
export { default as automodHandler } from './automod'
export { default as greetingHandler } from './greeting'
export { default as inviteHandler } from './invite'
export { default as presenceHandler } from './dev/presence/init'
export { default as statsHandler } from './stats'
export { default as ticketHandler } from './ticket/index'
export { default as todHandler } from './tod'
export { default as reportHandler } from './report'
export { default as guildHandler } from './guild'
// Profile handler - now modular, import functions as needed
// Legacy compatibility maintained through direct imports in interactionCreate.ts

// Handlers with named exports - export namespace
export * as commandHandler from './command'
export * as contextHandler from './context'
export * as counterHandler from './counter'
export * as reactionRoleHandler from './reactionRoles'
export * as managerHandler from './manager'
export * as playerHandler from './player'
