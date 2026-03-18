import {
  existsSync,
  writeFileSync,
  chmodSync,
  mkdirSync,
  rmSync,
  copyFileSync,
} from 'node:fs'
import path from 'node:path'

import {
  type SpawnResult,
  type PromptsFn,
  commandExists,
  error,
  log,
  warn,
  spawn,
  defaultPrompts,
} from './shared'
import { configureEnv, validateEnv, type EnvMode } from './env'
import { pollHealth, showDashboard } from './health'

const REPO_URL = 'https://github.com/iamvikshan/amina.git'
const DEFAULT_DEPLOY_DIR = 'amina'

export type InstallDependencies = {
  deployPath?: string
  spawnFn?: (args: string[], options?: { cwd?: string }) => SpawnResult
  commandExistsFn?: (cmd: string) => boolean
  fileExists?: (filePath: string) => boolean
  writeFile?: (filePath: string, content: string) => void
  chmod?: (filePath: string, mode: number) => void
  mkdir?: (dirPath: string, options?: { recursive: boolean }) => void
  rmdir?: (
    dirPath: string,
    options?: { recursive: boolean; force: boolean }
  ) => void
  copyFile?: (src: string, dest: string) => void
  prompts?: PromptsFn
  dryRun?: boolean
  force?: boolean
  mode?: 'deploy' | 'dev'
  tmpdir?: string
  isDebian?: () => boolean
  configureEnvFn?: (prompts: PromptsFn, mode: EnvMode) => Promise<string>
  validateEnvFn?: (content: string) => {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
}

/** Check and optionally install prerequisites based on mode. */
export async function ensurePrerequisites(
  deps: InstallDependencies
): Promise<{ ok: boolean; missing: string[] }> {
  const cmdExists = deps.commandExistsFn ?? commandExists
  const spawnFn = deps.spawnFn ?? spawn
  const prompts = deps.prompts ?? defaultPrompts()
  const mode = deps.mode ?? 'deploy'
  const dryRun = deps.dryRun ?? false
  const force = deps.force ?? false
  const isDebian = deps.isDebian ?? (() => existsSync('/etc/debian_version'))

  const missing: string[] = []

  if (!cmdExists('git')) missing.push('git')

  if (mode === 'deploy') {
    if (!cmdExists('docker')) missing.push('docker')
    const composeCheck = spawnFn(['docker', 'compose', 'version'])
    if (!composeCheck.success) missing.push('docker compose (v2 plugin)')
  }

  if (missing.length === 0) return { ok: true, missing: [] }

  if (!isDebian()) return { ok: false, missing }

  if (dryRun) {
    log('[DRY-RUN] Would auto-install: ' + missing.join(', '))
    return { ok: true, missing: [] }
  }

  if (!force) {
    const install = await prompts.confirm({
      message: `Missing: ${missing.join(', ')}. Auto-install on Debian/Ubuntu?`,
    })
    if (prompts.isCancel(install) || !install) return { ok: false, missing }
  }

  const needsGit = missing.includes('git')
  const needsDocker =
    missing.includes('docker') || missing.includes('docker compose (v2 plugin)')

  if (needsGit) {
    const update = spawnFn(['sudo', 'apt-get', 'update'])
    if (!update.success) return { ok: false, missing }
    const inst = spawnFn(['sudo', 'apt-get', 'install', '-y', 'git', 'curl'])
    if (!inst.success) return { ok: false, missing }
  }

  if (needsDocker) {
    const result = spawnFn([
      'sh',
      '-c',
      'curl -fsSL https://get.docker.com | sh',
    ])
    if (!result.success) return { ok: false, missing }
  }

  const stillMissing: string[] = []
  if (!cmdExists('git')) stillMissing.push('git')
  if (mode === 'deploy') {
    if (!cmdExists('docker')) stillMissing.push('docker')
    const recheck = spawnFn(['docker', 'compose', 'version'])
    if (!recheck.success) stillMissing.push('docker compose (v2 plugin)')
  }

  return stillMissing.length === 0
    ? { ok: true, missing: [] }
    : { ok: false, missing: stillMissing }
}

/** Check for an existing deployment and return the user's chosen action. */
export async function checkExistingDeployment(
  deps: InstallDependencies
): Promise<'proceed' | 'restart' | 'update' | 'reconfigure' | 'abort'> {
  const home = process.env.HOME ?? '/root'
  const deployPath = deps.deployPath ?? path.join(home, DEFAULT_DEPLOY_DIR)
  const fileExists = deps.fileExists ?? existsSync
  const spawnFn = deps.spawnFn ?? spawn
  const prompts = deps.prompts ?? defaultPrompts()
  const mode = deps.mode ?? 'deploy'
  const dryRun = deps.dryRun ?? false
  const force = deps.force ?? false

  if (mode === 'dev') {
    if (fileExists(path.join(deployPath, '.git'))) {
      warn("Use 'amina update' to update an existing clone.")
      return 'abort'
    }
    return 'proceed'
  }

  const hasCompose = fileExists(path.join(deployPath, 'docker-compose.yml'))
  const hasEnv = fileExists(path.join(deployPath, '.env'))

  if (!hasCompose && !hasEnv) return 'proceed'

  if (hasCompose !== hasEnv) {
    warn('Partial deployment detected. Proceeding with fresh install.')
    return 'proceed'
  }

  if (dryRun) {
    log('[DRY-RUN] Would show existing deployment menu.')
    return 'proceed'
  }

  if (force) return 'update'

  spawnFn(['docker', 'compose', 'ps', '-q'], { cwd: deployPath })

  const action = await prompts.select<
    'restart' | 'update' | 'reconfigure' | 'abort'
  >({
    message: 'Existing deployment detected. What would you like to do?',
    options: [
      { value: 'restart', label: 'Restart services' },
      { value: 'update', label: 'Update & restart' },
      { value: 'reconfigure', label: 'Full reconfigure' },
      { value: 'abort', label: 'Cancel' },
    ],
  })

  if (prompts.isCancel(action)) return 'abort'
  return action
}

/** Run a fresh Amina deployment or dev clone. */
export async function runInstall(
  deps: InstallDependencies = {}
): Promise<number> {
  const home = process.env.HOME ?? '/root'
  const deployPath = deps.deployPath ?? path.join(home, DEFAULT_DEPLOY_DIR)
  const spawnFn = deps.spawnFn ?? spawn
  const fileExists = deps.fileExists ?? existsSync
  const writeFile = deps.writeFile ?? writeFileSync
  const chmod = deps.chmod ?? chmodSync
  const mkdir = deps.mkdir ?? mkdirSync
  const rmdir = deps.rmdir ?? rmSync
  const copyFile = deps.copyFile ?? copyFileSync
  const prompts = deps.prompts ?? defaultPrompts()
  const dryRun = deps.dryRun ?? false
  const mode = deps.mode ?? 'deploy'
  const tmpdir = deps.tmpdir ?? path.join(deployPath, '.amina-tmp')

  const resolved: InstallDependencies = {
    ...deps,
    deployPath,
    spawnFn,
    fileExists,
    writeFile,
    chmod,
    mkdir,
    rmdir,
    prompts,
    dryRun,
    mode,
    tmpdir,
  }

  prompts.intro('Amina Install')

  const prereqs = await ensurePrerequisites(resolved)
  if (!prereqs.ok) {
    error('Missing prerequisites:')
    for (const m of prereqs.missing) error(`  - ${m}`)
    warn('Install the missing tools and try again.')
    return 1
  }

  const existing = await checkExistingDeployment(resolved)
  switch (existing) {
    case 'restart': {
      if (dryRun) {
        log('[DRY-RUN] Would restart services.')
      } else {
        const restart = spawnFn(['docker', 'compose', 'restart'], {
          cwd: deployPath,
        })
        if (!restart.success) {
          error(`docker compose restart failed: ${restart.stderr}`)
          return 1
        }
        const statuses = await pollHealth(spawnFn, prompts)
        showDashboard(statuses, deployPath, prompts)
      }
      return 0
    }
    case 'update': {
      if (dryRun) {
        log('[DRY-RUN] Would pull and restart services.')
      } else {
        const pull = spawnFn(['docker', 'compose', 'pull'], { cwd: deployPath })
        if (!pull.success) {
          error(`docker compose pull failed: ${pull.stderr}`)
          return 1
        }
        const up = spawnFn(['docker', 'compose', 'up', '-d'], {
          cwd: deployPath,
        })
        if (!up.success) {
          error(`docker compose up failed: ${up.stderr}`)
          return 1
        }
        const statuses = await pollHealth(spawnFn, prompts)
        showDashboard(statuses, deployPath, prompts)
      }
      return 0
    }
    case 'reconfigure':
      break
    case 'abort':
      return 0
    case 'proceed':
      break
  }

  // -- Dev flow --
  if (mode === 'dev') {
    if (dryRun) {
      log(`[DRY-RUN] Would clone ${REPO_URL} to ${deployPath}`)
    } else {
      const clone = spawnFn(['git', 'clone', REPO_URL, deployPath])
      if (!clone.success) {
        error(`Failed to clone repository: ${clone.stderr}`)
        return 1
      }
    }
    prompts.outro(
      'Source cloned. Run bun install and bun run dev to get started.'
    )
    return 0
  }

  // -- Deploy flow --
  if (dryRun) {
    log(`[DRY-RUN] Would clone ${REPO_URL} to ${tmpdir}`)
  } else {
    mkdir(tmpdir, { recursive: true })
    const clone = spawnFn(['git', 'clone', '--depth', '1', REPO_URL, tmpdir])
    if (!clone.success) {
      error(`Failed to clone repository: ${clone.stderr}`)
      rmdir(tmpdir, { recursive: true, force: true })
      return 1
    }
  }

  if (dryRun) {
    log('[DRY-RUN] Would create deploy directory and copy config files.')
  } else {
    mkdir(deployPath, { recursive: true })
    mkdir(path.join(deployPath, 'lavalink'), { recursive: true })

    const composeSrc = path.join(tmpdir, 'docker-compose.prod.yml')
    const lavalinkSrc = path.join(tmpdir, 'lavalink', 'application.yml')

    if (!fileExists(composeSrc)) {
      error('docker-compose.prod.yml not found in cloned repository.')
      rmdir(tmpdir, { recursive: true, force: true })
      return 1
    }

    try {
      copyFile(composeSrc, path.join(deployPath, 'docker-compose.yml'))
      if (fileExists(lavalinkSrc)) {
        copyFile(
          lavalinkSrc,
          path.join(deployPath, 'lavalink', 'application.yml')
        )
      }
    } catch (e) {
      error(
        `Failed to copy config files: ${e instanceof Error ? e.message : e}`
      )
      rmdir(tmpdir, { recursive: true, force: true })
      return 1
    }
  }

  // Env configuration with validation loop
  let envContent = ''
  let retries = 0
  const maxRetries = 3

  while (retries < maxRetries) {
    const envMode = await prompts.select<EnvMode>({
      message: 'How would you like to configure environment variables?',
      options: [
        { value: 'guided', label: 'Guided setup', hint: 'Interactive prompts' },
        { value: 'paste', label: 'Paste .env content' },
        { value: 'import', label: 'Import from file' },
      ],
    })

    if (prompts.isCancel(envMode)) {
      if (!dryRun) rmdir(tmpdir, { recursive: true, force: true })
      return 1
    }

    try {
      envContent = await (deps.configureEnvFn ?? configureEnv)(prompts, envMode)
    } catch {
      if (!dryRun) rmdir(tmpdir, { recursive: true, force: true })
      return 1
    }

    const validation = (deps.validateEnvFn ?? validateEnv)(envContent)
    if (validation.ok) {
      for (const w of validation.warnings) warn(w)
      break
    }

    for (const e of validation.errors) error(e)
    for (const w of validation.warnings) warn(w)
    retries++
    if (retries < maxRetries) warn('Please try again.')
  }

  if (retries >= maxRetries) {
    error('Failed to configure valid environment after 3 attempts.')
    if (!dryRun) rmdir(tmpdir, { recursive: true, force: true })
    return 1
  }

  const envPath = path.join(deployPath, '.env')
  if (dryRun) {
    log('[DRY-RUN] Would write .env file.')
  } else {
    writeFile(envPath, envContent)
    chmod(envPath, 0o600)
  }

  if (dryRun) {
    log('[DRY-RUN] Would run docker compose up -d.')
  } else {
    const up = spawnFn(['docker', 'compose', 'up', '-d'], { cwd: deployPath })
    if (!up.success) {
      error(`docker compose up failed: ${up.stderr}`)
      rmdir(tmpdir, { recursive: true, force: true })
      return 1
    }
  }

  if (!dryRun) {
    const statuses = await pollHealth(spawnFn, prompts)
    showDashboard(statuses, deployPath, prompts)
  }

  if (!dryRun) {
    rmdir(tmpdir, { recursive: true, force: true })
  }

  prompts.outro('Installation complete!')
  return 0
}
