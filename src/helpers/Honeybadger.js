// src/helpers/Honeybadger.js
const Honeybadger = require('@honeybadger-io/js')

// Configure Honeybadger
Honeybadger.configure({
  apiKey: process.env.HONEYBADGER_API_KEY || '',
  environment:
    process.env.HONEYBADGER_ENV || process.env.NODE_ENV || 'development',
  revision: process.env.HONEYBADGER_REVISION || 'unknown',

  // Enable or disable based on environment
  reportData: process.env.HONEYBADGER_API_KEY ? true : false,

  // Development settings
  developmentEnvironments: ['development', 'dev', 'test'],

  // Set the project root
  projectRoot: process.cwd(),

  // Configure what gets reported
  enableUncaught: true,
  enableUnhandledRejection: true,

  // Add custom filters to prevent sensitive data from being sent
  filters: ['password', 'token', 'secret', 'api_key', 'apiKey'],

  // Breadcrumbs for better debugging
  breadcrumbsEnabled: true,
  maxBreadcrumbs: 40,
})

// Add bot-specific context
Honeybadger.beforeNotify(notice => {
  // Add any default context you want on all errors
  notice.context = {
    ...notice.context,
    bot_name: 'Amina',
    node_version: process.version,
  }
})

module.exports = Honeybadger
