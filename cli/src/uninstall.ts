import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

import {
  type SpawnResult,
  type PromptsFn,
  error,
  log,
  success,
  warn,
  spawn,
  defaultPrompts,
} from './shared'

export type UninstallDependencies = {
  deployPath?: string
  fileExists?: (filePath: string) => boolean
  spawnFn?: (args: string[], options?: { cwd?: string }) => SpawnResult
  rmdir?: (
    dirPath: string,
    options?: { recursive: boolean; force: boolean }
  ) => void
  prompts?: PromptsFn
  dryRun?: boolean
  force?: boolean
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
 * Remove an existing Amina deployment.
 * @param deps - Optional runtime dependencies for testing.
 */
export async function runUninstall(
  deps: UninstallDependencies = {}
): Promise<number> {
  const home = process.env.HOME ?? '/root'
  const deployPath = deps.deployPath ?? path.join(home, 'amina')
  const fileExists = deps.fileExists ?? existsSync
  const spawnFn = deps.spawnFn ?? spawn
  const rmdir = deps.rmdir ?? rmSync
  const prompts = deps.prompts ?? defaultPrompts()
  const dryRun = deps.dryRun ?? false
  const force = deps.force ?? false

  const mode = detectMode(deployPath, fileExists)
  if (!mode) {
    error(`No deployment found at ${deployPath}`)
    warn('Nothing to uninstall.')
    return 1
  }

  log(`Found ${mode} deployment at ${deployPath}`)

  if (dryRun) {
    log('[DRY-RUN] Would stop and remove all services.')
    log(`[DRY-RUN] Would remove directory: ${deployPath}`)
    return 0
  }

  if (!force) {
    const confirmed = await prompts.confirm({
      message: `Are you sure you want to remove the ${mode} deployment at ${deployPath}?`,
    })
    if (prompts.isCancel(confirmed) || !confirmed) {
      warn('Uninstall cancelled.')
      return 0
    }
  }

  if (mode === 'deploy') {
    if (!force) {
      const removeVolumes = await prompts.confirm({
        message: 'Also remove Docker volumes (database data, etc.)?',
      })
      if (prompts.isCancel(removeVolumes)) {
        warn('Uninstall cancelled.')
        return 0
      }
      const downArgs = ['docker', 'compose', 'down', '--remove-orphans']
      if (removeVolumes) downArgs.push('-v')
      const down = spawnFn(downArgs, { cwd: deployPath })
      if (!down.success) {
        error(`docker compose down failed: ${down.stderr}`)
        return 1
      }
    } else {
      const down = spawnFn(
        ['docker', 'compose', 'down', '--remove-orphans', '-v'],
        { cwd: deployPath }
      )
      if (!down.success) {
        error(`docker compose down failed: ${down.stderr}`)
        return 1
      }
    }
  }

  rmdir(deployPath, { recursive: true, force: true })
  success(`Removed ${mode} deployment at ${deployPath}`)
  return 0
}
