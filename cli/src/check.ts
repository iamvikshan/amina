import packageJson from '../package.json' with { type: 'json' }

const RELEASES_API_URL =
  'https://api.github.com/repos/iamvikshan/amina/releases'
const GITHUB_RELEASES_URL = 'https://github.com/iamvikshan/amina/releases'
const GITLAB_RELEASE_URL = 'https://gitlab.com/vikshan/amina/-/releases'
const GHCR_IMAGE = 'ghcr.io/iamvikshan/amina'
const GITLAB_IMAGE = 'registry.gitlab.com/vikshan/amina'
const INSTALL_SCRIPT_URL =
  'https://raw.githubusercontent.com/iamvikshan/amina/main/scripts/install-cli.sh'
const CLI_RELEASE_TAG_PREFIX = 'cli-v'
const GITHUB_API_VERSION = '2022-11-28'
const RELEASES_PER_PAGE = 100

/**
 * Release metadata returned by the CLI release check.
 */
type ReleaseInfo = {
  latestTag: string
  latestVersion: string
  releaseUrl: string
}

/**
 * Fetch-compatible function used by the CLI release check.
 *
 * @param {string | URL | Request} input - The request URL or request object.
 * @param {RequestInit} [init] - Optional request configuration.
 * @returns {Promise<Response>} The HTTP response.
 */
export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

/**
 * Dependency injection hooks for the release check runtime.
 */
export type CliDependencies = {
  cwd?: string
  currentVersion?: string | null
  fetchImpl?: FetchLike
  readFile?: (filePath: string) => string
  fileExists?: (filePath: string) => boolean
  log?: (message: string) => void
  error?: (message: string) => void
}

/**
 * Minimal GitHub release shape needed by the release checker.
 */
type GitHubReleasePayload = {
  html_url?: unknown
  tag_name?: unknown
}

/**
 * Parsed semantic version parts used during comparisons.
 */
type ParsedVersion = {
  core: [number, number, number]
  prerelease: string[]
}

/**
 * Normalize a version string by removing a leading v prefix.
 *
 * @param {string} version - The version string to normalize.
 * @returns {string} The normalized version without a leading `v`.
 */
export function normalizeVersion(version: string): string {
  return version.trim().replace(/^(?:cli-)?v/, '')
}

const DEFAULT_CLI_VERSION =
  typeof packageJson.version === 'string' && packageJson.version.trim() !== ''
    ? normalizeVersion(packageJson.version)
    : null

/**
 * Resolve the installed CLI version from an injected override or bundled package metadata.
 *
 * @param {string | null | undefined} [currentVersion=DEFAULT_CLI_VERSION] - Optional current version override for tests.
 * @returns {string | null} The normalized installed CLI version, or `null` when it cannot be determined.
 */
export function resolveCurrentVersion(
  currentVersion: string | null | undefined = DEFAULT_CLI_VERSION
): string | null {
  if (typeof currentVersion !== 'string' || currentVersion.trim() === '') {
    return null
  }

  return normalizeVersion(currentVersion)
}

/**
 * Compare two semantic versions.
 *
 * @param {string} left - The left-hand version.
 * @param {string} right - The right-hand version.
 * @returns {number} A negative value when `left` is older, positive when newer, or `0` when equal.
 */
export function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)

  for (let index = 0; index < 3; index++) {
    const difference = leftParts.core[index] - rightParts.core[index]
    if (difference !== 0) {
      return difference
    }
  }

  if (leftParts.prerelease.length === 0 && rightParts.prerelease.length === 0) {
    return 0
  }

  if (leftParts.prerelease.length === 0) {
    return 1
  }

  if (rightParts.prerelease.length === 0) {
    return -1
  }

  const sharedLength = Math.max(
    leftParts.prerelease.length,
    rightParts.prerelease.length
  )

  for (let index = 0; index < sharedLength; index++) {
    const leftIdentifier = leftParts.prerelease[index]
    const rightIdentifier = rightParts.prerelease[index]

    if (leftIdentifier === undefined) {
      return -1
    }

    if (rightIdentifier === undefined) {
      return 1
    }

    const leftNumber = toNumericIdentifier(leftIdentifier)
    const rightNumber = toNumericIdentifier(rightIdentifier)

    if (leftNumber !== null && rightNumber !== null) {
      const difference = leftNumber - rightNumber
      if (difference !== 0) {
        return difference
      }
      continue
    }

    if (leftNumber !== null) {
      return -1
    }

    if (rightNumber !== null) {
      return 1
    }

    if (leftIdentifier < rightIdentifier) {
      return -1
    }

    if (leftIdentifier > rightIdentifier) {
      return 1
    }
  }

  return 0
}

/**
 * Fetch the latest published CLI release from GitHub by scanning the releases list.
 *
 * @param {FetchLike} [fetchImpl=fetch] - The fetch implementation to use.
 * @returns {Promise<ReleaseInfo>} The latest CLI release metadata.
 */
export async function fetchLatestRelease(
  fetchImpl: FetchLike = fetch
): Promise<ReleaseInfo> {
  for (let page = 1; ; page++) {
    const response = await fetchImpl(
      `${RELEASES_API_URL}?per_page=${RELEASES_PER_PAGE}&page=${page}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'amina',
          'x-github-api-version': GITHUB_API_VERSION,
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `GitHub releases request failed with ${response.status} ${response.statusText}`.trim()
      )
    }

    const payload = (await response.json()) as unknown

    if (!Array.isArray(payload)) {
      throw new Error('GitHub releases response did not return an array')
    }

    const latestCliRelease = payload.find(isCliReleasePayload)

    if (latestCliRelease) {
      return {
        latestTag: latestCliRelease.tag_name,
        latestVersion: normalizeVersion(latestCliRelease.tag_name),
        releaseUrl:
          typeof latestCliRelease.html_url === 'string' &&
          latestCliRelease.html_url.trim() !== ''
            ? latestCliRelease.html_url
            : `${GITHUB_RELEASES_URL}/tag/${latestCliRelease.tag_name}`,
      }
    }

    if (payload.length < RELEASES_PER_PAGE) {
      break
    }
  }

  throw new Error(
    `GitHub releases response did not include a ${CLI_RELEASE_TAG_PREFIX} tag`
  )
}

/**
 * Build the CLI output for the detected version state.
 *
 * @param {ReleaseInfo} latestRelease - The latest release information.
 * @param {string | null} currentVersion - The detected installed CLI version, if any.
 * @returns {string[]} The lines that should be printed to the terminal.
 */
export function formatCliOutput(
  latestRelease: ReleaseInfo,
  currentVersion: string | null
): string[] {
  if (!currentVersion) {
    return [
      `Latest Amina CLI release: ${latestRelease.latestVersion}`,
      'Installed Amina CLI version could not be determined.',
      ...createUpgradeInstructions(latestRelease.releaseUrl),
    ]
  }

  const comparison = compareVersions(
    currentVersion,
    latestRelease.latestVersion
  )

  if (comparison === 0) {
    return [
      'Amina CLI is up to date.',
      `Current version: ${currentVersion}`,
      `Latest release: ${latestRelease.latestVersion}`,
    ]
  }

  if (comparison > 0) {
    return [
      'Installed CLI version is newer than the latest published CLI release.',
      `Current version: ${currentVersion}`,
      `Latest release: ${latestRelease.latestVersion}`,
    ]
  }

  return [
    `Update available: ${currentVersion} -> ${latestRelease.latestVersion}`,
    ...createUpgradeInstructions(latestRelease.releaseUrl),
  ]
}

/**
 * Run the version-check CLI.
 *
 * @param {CliDependencies} [dependencies={}] - Optional runtime dependencies for testing.
 * @returns {Promise<number>} Exit code `0` on success, otherwise `1`.
 */
export async function runCheck(
  dependencies: CliDependencies = {}
): Promise<number> {
  const log = dependencies.log ?? console.log
  const error = dependencies.error ?? console.error

  try {
    const latestRelease = await fetchLatestRelease(dependencies.fetchImpl)
    const currentVersion = resolveCurrentVersion(dependencies.currentVersion)

    for (const line of formatCliOutput(latestRelease, currentVersion)) {
      log(line)
    }

    return 0
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : 'Unknown error'

    error(`Failed to check the latest Amina CLI release: ${message}`)
    return 1
  }
}

/**
 * Build upgrade instructions for users who are behind the latest release.
 *
 * @param {string} releaseUrl - The GitHub release URL to show for source archives.
 * @returns {string[]} Suggested upgrade commands and reference links.
 */
function createUpgradeInstructions(releaseUrl: string): string[] {
  return [
    `curl -fsSL ${INSTALL_SCRIPT_URL} | sh`,
    `CLI release notes: ${releaseUrl}`,
    'Other Amina release channels:',
    `- GitHub: ${GITHUB_RELEASES_URL}`,
    `- GitLab: ${GITLAB_RELEASE_URL}`,
    'Container images:',
    `- GHCR: docker pull ${GHCR_IMAGE}:latest`,
    `- GitLab Registry: docker pull ${GITLAB_IMAGE}:latest`,
    'After updating the source or image, restart Amina with your usual deployment process.',
  ]
}

/**
 * Parse a semantic version into numeric core and prerelease parts.
 *
 * @param {string} version - The version string to parse.
 * @returns {ParsedVersion} The parsed semantic version components.
 */
function parseVersion(version: string): ParsedVersion {
  const normalizedVersion = normalizeVersion(version)
  const [mainPart, prereleasePart = ''] = normalizedVersion.split('-', 2)
  const core = mainPart.split('.')

  if (core.length !== 3 || core.some(part => !/^\d+$/.test(part))) {
    throw new Error(`Invalid semantic version: ${version}`)
  }

  return {
    core: [Number(core[0]), Number(core[1]), Number(core[2])],
    prerelease:
      prereleasePart === ''
        ? []
        : prereleasePart.split('.').filter(part => part !== ''),
  }
}

/**
 * Determine whether a release payload belongs to the CLI release channel.
 *
 * @param {unknown} value - The raw release payload value.
 * @returns {boolean} `true` when the payload contains a `cli-v*` tag.
 */
function isCliReleasePayload(
  value: unknown
): value is GitHubReleasePayload & { tag_name: string } {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const { tag_name: tagName } = value as GitHubReleasePayload

  return (
    typeof tagName === 'string' && tagName.startsWith(CLI_RELEASE_TAG_PREFIX)
  )
}

/**
 * Convert a prerelease identifier to a number when it is numeric.
 *
 * @param {string} identifier - The prerelease identifier to inspect.
 * @returns {number | null} The numeric identifier, or `null` when it is not numeric.
 */
function toNumericIdentifier(identifier: string): number | null {
  return /^\d+$/.test(identifier) ? Number(identifier) : null
}
