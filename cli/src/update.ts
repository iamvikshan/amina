import { existsSync } from 'node:fs'
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
import { pollHealth, showDashboard } from './health'

const REPO_URL = 'https://github.com/iamvikshan/amina.git'

export type UpdateDependencies = {
  deployPath?: string
  fileExists?: (filePath: string) => boolean
  spawnFn?: (args: string[], options?: { cwd?: string }) => SpawnResult
  prompts?: PromptsFn
  dryRun?: boolean
  force?: boolean
  mode?: 'deploy' | 'dev'
}

function detectMode(
  deployPath: string,
  fileExists: (p: string) => boolean
): 'deploy' | 'dev' | null {
  if (fileExists(path.join(deployPath, 'docker-compose.yml'))) return 'deploy'
  if (fileExists(path.join(deployPath, '.git'))) return 'dev'
  return null
}

function parseImageIds(stdout: string): Record<string, string> {
  const ids: Record<string, string> = {}
  if (!stdout.trim()) return ids
  try {
    for (const line of stdout.trim().split('\n')) {
      const entry = JSON.parse(line)
      if (entry.Service && entry.ID) ids[entry.Service] = entry.ID
    }
  } catch {
    // unparseable output -> empty map triggers full restart
  }
  return ids
}

function changedServices(
  before: Record<string, string>,
  after: Record<string, string>
): string[] {
  const changed: string[] = []
  for (const [service, id] of Object.entries(after)) {
    if (before[service] !== id) changed.push(service)
  }
  return changed
}

async function updateDeploy(opts: {
  deployPath: string
  spawnFn: (args: string[], options?: { cwd?: string }) => SpawnResult
  prompts: PromptsFn
  dryRun: boolean
}): Promise<number> {
  const { deployPath, spawnFn, prompts, dryRun } = opts

  if (dryRun) {
    log('[DRY-RUN] Would pull latest images.')
    log('[DRY-RUN] Would restart changed services.')
    log('[DRY-RUN] Would prune old images.')
    return 0
  }

  const beforeResult = spawnFn(
    ['docker', 'compose', 'images', '--format', 'json'],
    { cwd: deployPath }
  )
  const beforeIds = parseImageIds(beforeResult.stdout)

  log('Pulling latest images...')
  const pull = spawnFn(['docker', 'compose', 'pull'], { cwd: deployPath })
  if (!pull.success) {
    error(`docker compose pull failed: ${pull.stderr}`)
    return 1
  }

  const afterResult = spawnFn(
    ['docker', 'compose', 'images', '--format', 'json'],
    { cwd: deployPath }
  )
  const afterIds = parseImageIds(afterResult.stdout)
  const changed = changedServices(beforeIds, afterIds)

  if (changed.length === 0) {
    success('All images are already up to date.')
  } else {
    log(`Restarting changed services: ${changed.join(', ')}`)
    const up = spawnFn(['docker', 'compose', 'up', '-d', ...changed], {
      cwd: deployPath,
    })
    if (!up.success) {
      error(`docker compose up failed: ${up.stderr}`)
      return 1
    }
  }

  const statuses = await pollHealth(spawnFn, prompts)
  showDashboard(statuses, deployPath, prompts)

  spawnFn(['docker', 'image', 'prune', '-f'])
  success('Amina deployment updated successfully.')
  return 0
}

async function updateDev(opts: {
  deployPath: string
  spawnFn: (args: string[], options?: { cwd?: string }) => SpawnResult
  prompts: PromptsFn
  dryRun: boolean
  force: boolean
}): Promise<number> {
  const { deployPath, spawnFn, prompts, dryRun, force } = opts

  if (dryRun) {
    log('[DRY-RUN] Would fetch and pull latest changes.')
    return 0
  }

  const fetch = spawnFn(['git', 'fetch', '--prune'], { cwd: deployPath })
  if (!fetch.success) {
    error(`git fetch failed: ${fetch.stderr}`)
    return 1
  }

  const status = spawnFn(['git', 'status', '--porcelain'], { cwd: deployPath })
  const isDirty = status.stdout.trim().length > 0

  if (!isDirty) {
    log('Working tree is clean. Pulling latest...')
    const pull = spawnFn(['git', 'pull', '--ff-only'], { cwd: deployPath })
    if (!pull.success) {
      error(`git pull failed: ${pull.stderr}`)
      return 1
    }
    success('Updated successfully.')
    return 0
  }

  if (force) {
    log('Force mode: stashing local changes...')
    spawnFn(['git', 'stash', 'push', '-u'], { cwd: deployPath })
    const pull = spawnFn(['git', 'pull', '--ff-only'], { cwd: deployPath })
    if (!pull.success) {
      error(`git pull failed: ${pull.stderr}`)
      spawnFn(['git', 'stash', 'pop'], { cwd: deployPath })
      warn('Local changes have been restored.')
      return 1
    }
    spawnFn(['git', 'stash', 'drop'], { cwd: deployPath })
    success('Updated successfully (local changes were stashed and dropped).')
    return 0
  }

  const action = await prompts.select<'overwrite' | 'versioned' | 'cancel'>({
    message: 'Local changes detected. How would you like to proceed?',
    options: [
      {
        value: 'overwrite',
        label: 'Overwrite local changes',
        hint: 'stash, pull, drop stash',
      },
      {
        value: 'versioned',
        label: 'Pull to versioned folder',
        hint: 'clone alongside current dir',
      },
      { value: 'cancel', label: 'Cancel' },
    ],
  })

  if (prompts.isCancel(action) || action === 'cancel') {
    warn('Update cancelled.')
    return 0
  }

  if (action === 'overwrite') {
    spawnFn(['git', 'stash', 'push', '-u'], { cwd: deployPath })
    const pull = spawnFn(['git', 'pull', '--ff-only'], { cwd: deployPath })
    if (!pull.success) {
      error(`git pull failed: ${pull.stderr}`)
      spawnFn(['git', 'stash', 'pop'], { cwd: deployPath })
      warn('Local changes have been restored.')
      return 1
    }
    spawnFn(['git', 'stash', 'drop'], { cwd: deployPath })
    success('Updated successfully.')
    return 0
  }

  const confirmed = await prompts.confirm({
    message:
      'This will clone the latest version into a new folder alongside the current one. Continue?',
  })
  if (prompts.isCancel(confirmed) || !confirmed) {
    warn('Update cancelled.')
    return 0
  }

  const tagResult = spawnFn(['git', 'describe', '--tags', '--abbrev=0'], {
    cwd: deployPath,
  })
  const version = tagResult.success
    ? tagResult.stdout.replace(/^v/, '')
    : 'latest'
  const parentDir = path.dirname(deployPath)
  const versionedPath = path.join(parentDir, `amina-v${version}`)

  const clone = spawnFn(['git', 'clone', REPO_URL, versionedPath])
  if (!clone.success) {
    error(`Failed to clone to ${versionedPath}: ${clone.stderr}`)
    return 1
  }

  success(`Cloned latest to ${versionedPath}`)
  return 0
}

/**
 * Update an existing Amina deployment (deploy or dev mode).
 * @param dependencies - Optional runtime dependencies for testing.
 */
export async function runUpdate(
  dependencies: UpdateDependencies = {}
): Promise<number> {
  const home = process.env.HOME ?? '/root'
  const deployPath = dependencies.deployPath ?? path.join(home, 'amina')
  const fileExists = dependencies.fileExists ?? existsSync
  const spawnFn = dependencies.spawnFn ?? spawn
  const prompts = dependencies.prompts ?? defaultPrompts()
  const dryRun = dependencies.dryRun ?? false
  const force = dependencies.force ?? false
  const mode = dependencies.mode ?? detectMode(deployPath, fileExists)

  if (!mode) {
    error(`No deployment found at ${deployPath}`)
    warn('Run "amina install" to set up a fresh deployment.')
    return 1
  }

  log(`Updating Amina (${mode} mode) in ${deployPath}...`)

  if (mode === 'deploy') {
    return updateDeploy({ deployPath, spawnFn, prompts, dryRun })
  }

  return updateDev({ deployPath, spawnFn, prompts, dryRun, force })
}
