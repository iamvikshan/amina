// src/helpers/Honeybadger.ts
import Honeybadger from '@honeybadger-io/js'

// Determine environment from multiple sources
const environment =
  process.env.HONEYBADGER_ENV ||
  process.env.NODE_ENV ||
  process.env.DOPPLER_ENVIRONMENT ||
  'development'

const isDevelopment = ['development', 'dev', 'test'].includes(
  environment.toLowerCase()
)

// Configure Honeybadger
Honeybadger.configure({
  apiKey: process.env.HONEYBADGER_API_KEY || '',
  environment,
  revision: process.env.HONEYBADGER_REVISION || 'unknown',

  // Enable or disable based on environment - disable in dev
  reportData: isDevelopment
    ? false
    : process.env.HONEYBADGER_API_KEY
      ? true
      : false,

  // Development settings
  developmentEnvironments: ['development', 'dev', 'test'],

  // Set the project root
  projectRoot: process.cwd(),

  // Configure what gets reported
  enableUncaught: !isDevelopment, // Disable in dev to prevent terminal noise
  enableUnhandledRejection: !isDevelopment, // Disable in dev

  // Add custom filters to prevent sensitive data from being sent
  filters: ['password', 'token', 'secret', 'api_key', 'apiKey'],

  // Breadcrumbs for better debugging
  breadcrumbsEnabled: !isDevelopment, // Disable in dev
  maxBreadcrumbs: 40,

  // Disable debug logging in development
  debug: false,
})

// Add bot-specific context
Honeybadger.beforeNotify(notice => {
  // Don't notify in development (double safety)
  if (isDevelopment) {
    return false // Returning false prevents the notification
  }

  // Add any default context you want on all errors
  notice.context = {
    ...notice.context,
    bot_name: 'Amina',
    node_version: process.version,
  }
})

// Create a wrapper that does nothing in development
const HoneybadgerWrapper = {
  notify: (error: any, context?: any) => {
    if (!isDevelopment) {
      return Honeybadger.notify(error, context)
    }
    // In development, just return a resolved promise
    return Promise.resolve()
  },
  setContext: (context: any) => {
    if (!isDevelopment) {
      Honeybadger.setContext(context)
    }
  },
  resetContext: () => {
    if (!isDevelopment) {
      Honeybadger.resetContext()
    }
  },
  clear: () => {
    if (!isDevelopment) {
      Honeybadger.clear()
    }
  },
  beforeNotify: (callback: (notice: any) => boolean | void) => {
    if (!isDevelopment) {
      Honeybadger.beforeNotify(callback)
    }
  },
  configure: (options: any) => {
    if (!isDevelopment) {
      Honeybadger.configure(options)
    }
  },
}

export default HoneybadgerWrapper

