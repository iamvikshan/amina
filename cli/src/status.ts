import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  type SpawnResult,
  type PromptsFn,
  error,
  warn,
  spawn,
  defaultPrompts,
} from './shared'
import { pollHealth, showDashboard } from './health'

export type StatusDependencies = {
  deployPath?: string
  fileExists?: (filePath: string) => boolean
  spawnFn?: (args: string[], options?: { cwd?: string }) => SpawnResult
  prompts?: PromptsFn
}

function detectMode(
  deployPath: string,
  fileExists: (p: string) => boolean
): 'deploy' | 'dev' | null {
  if (fileExists(path.join(deployPath, 'docker-compose.yml'))) return 'deploy'
  if (fileExists(path.join(deployPath, '.git'))) return 'dev'
  return null
}

/**
 * Show the status of an existing Amina deployment.
 * @param deps - Optional runtime dependencies for testing.
 */
export async function runStatus(
  deps: StatusDependencies = {}
): Promise<number> {
  const home = process.env.HOME ?? '/root'
  const deployPath = deps.deployPath ?? path.join(home, 'amina')
  const fileExists = deps.fileExists ?? existsSync
  const spawnFn = deps.spawnFn ?? spawn
  const prompts = deps.prompts ?? defaultPrompts()

  const mode = detectMode(deployPath, fileExists)
  if (!mode) {
    error(`No deployment found at ${deployPath}`)
    warn('Run "amina install" to set up a fresh deployment.')
    return 1
  }

  if (mode === 'deploy') {
    const statuses = await pollHealth(spawnFn, prompts, {
      timeout: 10_000,
      interval: 2_000,
    })
    showDashboard(statuses, deployPath, prompts)
    return 0
  }

  const branch = spawnFn(['git', 'branch', '--show-current'], {
    cwd: deployPath,
  })
  const lastCommit = spawnFn(['git', 'log', '--oneline', '-1'], {
    cwd: deployPath,
  })

  if (!branch.success || !lastCommit.success) {
    error('Failed to read git repository status.')
    return 1
  }

  const status = spawnFn(['git', 'status', '--short'], { cwd: deployPath })

  prompts.log.info(`Branch: ${branch.stdout || 'unknown'}`)
  prompts.log.info(`Last commit: ${lastCommit.stdout || 'unknown'}`)

  if (status.stdout) {
    prompts.log.warn('Uncommitted changes:')
    prompts.log.info(status.stdout)
  } else {
    prompts.log.success('Working tree is clean.')
  }

  return 0
}
