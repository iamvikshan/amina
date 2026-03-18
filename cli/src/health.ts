import { sleep } from './shared'
import type { SpawnResult, PromptsFn } from './shared'

export const SERVICES = [
  'amina',
  'lavalink',
  'cloudflared',
  'watchtower',
] as const

type SpawnFn = (args: string[], opts?: { cwd?: string }) => SpawnResult

export type HealthOptions = {
  timeout?: number
  interval?: number
}

const DEFAULT_TIMEOUT = 120_000
const DEFAULT_INTERVAL = 5_000

function checkService(spawnFn: SpawnFn, name: string): string {
  const format =
    name === 'watchtower' ? '{{.State.Status}}' : '{{.State.Health.Status}}'
  const result = spawnFn(['docker', 'inspect', `--format=${format}`, name])
  return result.success ? result.stdout : 'not found'
}

function isTerminal(statuses: Record<string, string>): boolean {
  const values = Object.values(statuses)
  const allReady = values.every(s => s === 'healthy' || s === 'running')
  const anyUnhealthy = values.some(s => s === 'unhealthy')
  return allReady || anyUnhealthy
}

/** Poll Docker containers until all healthy or timeout. */
export async function pollHealth(
  spawnFn: SpawnFn,
  prompts: PromptsFn,
  opts?: HealthOptions
): Promise<Record<string, string>> {
  const timeout = opts?.timeout ?? DEFAULT_TIMEOUT
  const interval = opts?.interval ?? DEFAULT_INTERVAL
  const spin = prompts.spinner()
  spin.start('Waiting for services to become healthy...')

  const deadline = Date.now() + timeout
  let statuses: Record<string, string> = {}

  while (Date.now() < deadline) {
    statuses = {}
    for (const name of SERVICES) {
      statuses[name] = checkService(spawnFn, name)
    }

    const summary = Object.entries(statuses)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ')
    spin.message(summary)

    if (isTerminal(statuses)) break
    await sleep(interval)
  }

  const values = Object.values(statuses)
  const allReady =
    values.length > 0 && values.every(s => s === 'healthy' || s === 'running')
  const anyUnhealthy = values.some(s => s === 'unhealthy')

  if (allReady) {
    spin.stop('All services are ready.')
  } else if (anyUnhealthy) {
    spin.stop('Some services are unhealthy.')
  } else {
    spin.stop('Timed out waiting for services.')
  }
  return statuses
}

/** Format a deployment status dashboard. */
export function formatDashboard(
  statuses: Record<string, string>,
  deployPath: string
): string[] {
  const lines: string[] = ['', '=== Amina Deployment Status ===', '']

  for (const [name, status] of Object.entries(statuses)) {
    const icon = status === 'healthy' || status === 'running' ? '[+]' : '[x]'
    lines.push(`  ${icon} ${name}: ${status}`)
  }

  lines.push(
    '',
    '--- Useful Commands ---',
    `  View logs:    docker compose -f ${deployPath}/docker-compose.yml logs -f`,
    `  Restart:      docker compose -f ${deployPath}/docker-compose.yml restart`,
    `  Stop:         docker compose -f ${deployPath}/docker-compose.yml down`,
    `  Update:       amina update`,
    `  Uninstall:    rm -rf ${deployPath}`,
    ''
  )

  return lines
}

/** Display the health dashboard using prompts logging. */
export function showDashboard(
  statuses: Record<string, string>,
  deployPath: string,
  prompts: PromptsFn
): void {
  const lines = formatDashboard(statuses, deployPath)
  const anyBad = Object.values(statuses).some(
    s => s !== 'healthy' && s !== 'running'
  )

  for (const line of lines) {
    if (anyBad) {
      prompts.log.warn(line)
    } else {
      prompts.log.success(line)
    }
  }
}
