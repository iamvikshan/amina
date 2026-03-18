import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const RELEASE_API_URL =
  'https://api.github.com/repos/iamvikshan/amina/releases/latest'
const GITHUB_RELEASE_URL = 'https://github.com/iamvikshan/amina/releases/latest'
const GITLAB_RELEASE_URL = 'https://gitlab.com/vikshan/amina/-/releases'
const GHCR_IMAGE = 'ghcr.io/iamvikshan/amina'
const GITLAB_IMAGE = 'registry.gitlab.com/vikshan/amina'
const PACKAGE_NAME = 'amina'

type ReleaseInfo = {
  latestTag: string
  latestVersion: string
  releaseUrl: string
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

export type CliDependencies = {
  cwd?: string
  fetchImpl?: FetchLike
  readFile?: (filePath: string) => string
  fileExists?: (filePath: string) => boolean
  log?: (message: string) => void
  error?: (message: string) => void
}

type PackageJson = {
  name?: unknown
  version?: unknown
}

/**
 * Normalize a version string by removing a leading v prefix.
 * @param version - The version string to normalize.
 */
export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/, '')
}

/**
 * Compare two semantic versions.
 * @param left - The left-hand version.
 * @param right - The right-hand version.
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
 * Search upward from a directory for the local Amina package version.
 * @param startDirectory - The directory to begin searching from.
 * @param dependencies - File system dependencies for testing.
 */
export function findLocalVersion(
  startDirectory: string,
  dependencies: Pick<CliDependencies, 'fileExists' | 'readFile'> = {}
): string | null {
  const fileExists = dependencies.fileExists ?? existsSync
  const readFile = dependencies.readFile ?? readFileSyncUtf8

  let currentDirectory = path.resolve(startDirectory)

  while (true) {
    const packageJsonPath = path.join(currentDirectory, 'package.json')

    if (fileExists(packageJsonPath)) {
      let packageJson: PackageJson | null = null

      try {
        packageJson = parsePackageJson(readFile(packageJsonPath))
      } catch (caughtError) {
        if (!(caughtError instanceof SyntaxError)) {
          throw caughtError
        }
      }

      if (
        packageJson?.name === PACKAGE_NAME &&
        typeof packageJson.version === 'string' &&
        packageJson.version.trim() !== ''
      ) {
        return normalizeVersion(packageJson.version)
      }
    }

    const parentDirectory = path.dirname(currentDirectory)
    if (parentDirectory === currentDirectory) {
      return null
    }

    currentDirectory = parentDirectory
  }
}

/**
 * Fetch the latest Amina release from GitHub.
 * @param fetchImpl - The fetch implementation to use.
 */
export async function fetchLatestRelease(
  fetchImpl: FetchLike = fetch
): Promise<ReleaseInfo> {
  const response = await fetchImpl(RELEASE_API_URL, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'amina',
    },
  })

  if (!response.ok) {
    throw new Error(
      `GitHub latest release request failed with ${response.status} ${response.statusText}`.trim()
    )
  }

  const payload = (await response.json()) as {
    html_url?: unknown
    tag_name?: unknown
  }

  if (typeof payload.tag_name !== 'string' || payload.tag_name.trim() === '') {
    throw new Error('GitHub latest release response did not include tag_name')
  }

  return {
    latestTag: payload.tag_name,
    latestVersion: normalizeVersion(payload.tag_name),
    releaseUrl:
      typeof payload.html_url === 'string' && payload.html_url.trim() !== ''
        ? payload.html_url
        : GITHUB_RELEASE_URL,
  }
}

/**
 * Build the CLI output for the detected version state.
 * @param latestRelease - The latest release information.
 * @param localVersion - The detected local version, if any.
 */
export function formatCliOutput(
  latestRelease: ReleaseInfo,
  localVersion: string | null
): string[] {
  if (!localVersion) {
    return [
      `Latest Amina release: ${latestRelease.latestVersion}`,
      'Local Amina version could not be detected.',
      ...createUpgradeInstructions(latestRelease.releaseUrl),
    ]
  }

  const comparison = compareVersions(localVersion, latestRelease.latestVersion)

  if (comparison === 0) {
    return [
      'Amina is up to date.',
      `Current version: ${localVersion}`,
      `Latest release: ${latestRelease.latestVersion}`,
    ]
  }

  if (comparison > 0) {
    return [
      'Local version is newer than the latest published release.',
      `Current version: ${localVersion}`,
      `Latest release: ${latestRelease.latestVersion}`,
    ]
  }

  return [
    `Update available: ${localVersion} -> ${latestRelease.latestVersion}`,
    ...createUpgradeInstructions(latestRelease.releaseUrl),
  ]
}

/**
 * Run the version-check CLI.
 * @param dependencies - Optional runtime dependencies for testing.
 */
export async function runCheck(
  dependencies: CliDependencies = {}
): Promise<number> {
  const cwd = dependencies.cwd ?? process.cwd()
  const log = dependencies.log ?? console.log
  const error = dependencies.error ?? console.error

  try {
    const latestRelease = await fetchLatestRelease(dependencies.fetchImpl)
    const localVersion = findLocalVersion(cwd, dependencies)

    for (const line of formatCliOutput(latestRelease, localVersion)) {
      log(line)
    }

    return 0
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : 'Unknown error'

    error(`Failed to check the latest Amina release: ${message}`)
    return 1
  }
}

function createUpgradeInstructions(releaseUrl: string): string[] {
  return [
    'Source releases (GitHub/GitLab source archives only):',
    `- GitHub: ${releaseUrl}`,
    `- GitLab: ${GITLAB_RELEASE_URL}`,
    'Container images:',
    `- GHCR: docker pull ${GHCR_IMAGE}:latest`,
    `- GitLab Registry: docker pull ${GITLAB_IMAGE}:latest`,
    'After updating the source or image, restart Amina with your usual deployment process.',
  ]
}

function parseVersion(version: string): {
  core: [number, number, number]
  prerelease: string[]
} {
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

function parsePackageJson(contents: string): PackageJson {
  return JSON.parse(contents) as PackageJson
}

function readFileSyncUtf8(filePath: string): string {
  return readFileSync(filePath, 'utf8')
}

function toNumericIdentifier(identifier: string): number | null {
  return /^\d+$/.test(identifier) ? Number(identifier) : null
}
