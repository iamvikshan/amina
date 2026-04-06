#!/usr/bin/env bun

import packageJson from '../package.json' with { type: 'json' }

import { runCheck } from './check'
import { runInstall } from './install'
import {
  crimson,
  cyberBlue,
  dim,
  electricBlue,
  gold,
  green,
  roseRed,
} from './shared'
import { runStatus } from './status'
import { runUninstall } from './uninstall'
import { runUpdate } from './update'

type CliFlags = {
  dryRun: boolean
  force: boolean
  mode: 'deploy' | 'dev'
}

export function parseFlags(args: string[]): CliFlags {
  const flags: CliFlags = { dryRun: false, force: false, mode: 'deploy' }
  for (let i = 3; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--dry-run') flags.dryRun = true
    else if (arg === '--force' || arg === '-f' || arg === '-y')
      flags.force = true
    else if (arg === '--mode' && i + 1 < args.length) {
      const val = args[++i]
      if (val === 'deploy' || val === 'dev') flags.mode = val
    }
  }
  return flags
}

const { version: VERSION } = packageJson

const BANNER = [
  crimson('    _    __  __ ___ _   _    _    '),
  crimson('   / \\  |  \\/  |_ _| \\ | |  / \\   '),
  roseRed('  / _ \\ | |\\/| || ||  \\| | / _ \\  '),
  roseRed(' / ___ \\| |  | || || |\\  |/ ___ \\ '),
  electricBlue('/_/   \\_\\_|  |_|___|_| \\_/_/   \\_\\'),
].join('\n')

const SUBTITLE = dim(`  Discord Bot Deployment CLI ${cyberBlue(`v${VERSION}`)}`)

const SEP = dim('─'.repeat(42))

const HELP_TEXT = `
${BANNER}
${SUBTITLE}
${SEP}

${electricBlue.bold('Usage:')} amina <command> [options]

${electricBlue.bold('Commands:')}
  ${green('check')}      ${dim('Check for new Amina releases')}
  ${green('install')}    ${dim('Deploy a fresh Amina instance')}
  ${green('update')}     ${dim('Update an existing deployment')}
  ${green('uninstall')}  ${dim('Remove an Amina deployment')}
  ${green('status')}     ${dim('Show deployment status')}
  ${green('help')}       ${dim('Show this help message')}

${electricBlue.bold('Options:')}
  ${gold('--dry-run')}   ${dim('Preview changes without executing')}
  ${gold('--force')}     ${dim('Skip confirmations (auto-approve)')}
  ${gold('--mode')}      ${dim('Set mode: deploy (default) or dev')}
  ${gold('-f, -y')}      ${dim('Alias for --force')}
${SEP}
`

/**
 * Route to the appropriate subcommand based on argv.
 * @param {string[]} args - CLI arguments (defaults to process.argv).
 * @returns {Promise<number>} The CLI exit code.
 */
export async function main(args: string[] = process.argv): Promise<number> {
  const subcommand = args[2] ?? 'help'
  const flags = parseFlags(args)

  switch (subcommand) {
    case 'check':
      return runCheck()
    case 'install':
      return runInstall({
        dryRun: flags.dryRun,
        force: flags.force,
        mode: flags.mode,
      })
    case 'update':
      return runUpdate({
        dryRun: flags.dryRun,
        force: flags.force,
        mode: flags.mode,
      })
    case 'uninstall':
      return runUninstall({ dryRun: flags.dryRun, force: flags.force })
    case 'status':
      return runStatus()
    case 'help':
    case '--help':
    case '-h':
      console.log(HELP_TEXT)
      return 0
    default:
      console.error(crimson(`Unknown command: ${subcommand}\n`))
      console.log(HELP_TEXT)
      return 1
  }
}

const isMain = import.meta.main
if (isMain) {
  process.exitCode = await main()
}
