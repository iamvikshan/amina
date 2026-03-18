#!/usr/bin/env node

import { fileURLToPath } from 'node:url'

import { runCheck } from './check'
import { runInstall } from './install'
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

const HELP_TEXT = `amina - Amina deployment CLI

Usage: amina <command> [options]

Commands:
  check      Check for new Amina releases
  install    Deploy a fresh Amina instance
  update     Update an existing deployment
  uninstall  Remove an Amina deployment
  status     Show deployment status
  help       Show this help message

Options:
  --dry-run   Preview changes without executing
  --force     Skip confirmations (auto-approve)
  --mode      Set mode: deploy (default) or dev
  -f, -y      Alias for --force
`

/**
 * Route to the appropriate subcommand based on argv.
 * @param args - CLI arguments (defaults to process.argv).
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
      console.error(`Unknown command: ${subcommand}\n`)
      console.log(HELP_TEXT)
      return 1
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  process.exitCode = await main()
}
