import { spawnSync } from 'node:child_process'
import * as clack from '@clack/prompts'

const RESET = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'

export function log(message: string): void {
  console.log(`${BLUE}[*]${RESET} ${message}`)
}

export function warn(message: string): void {
  console.warn(`${YELLOW}[!]${RESET} ${message}`)
}

export function error(message: string): void {
  console.error(`${RED}[x]${RESET} ${message}`)
}

export function success(message: string): void {
  console.log(`${GREEN}[+]${RESET} ${message}`)
}

export const sleep = (ms: number): Promise<void> =>
  new Promise(r => setTimeout(r, ms))

export type SpawnResult = {
  success: boolean
  stdout: string
  stderr: string
}

export type SpawnOptions = {
  cwd?: string
}

/**
 * Run a subprocess with array args via Node child_process. No shell injection.
 * @param args - Command and arguments as an array.
 * @param options - Optional cwd override.
 */
export function spawn(args: string[], options?: SpawnOptions): SpawnResult {
  const result = spawnSync(args[0], args.slice(1), {
    cwd: options?.cwd,
    encoding: 'utf8',
  })

  return {
    success: result.status === 0,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  }
}

/**
 * Check whether a command exists on the system PATH.
 * @param cmd - The command name to look up.
 */
export function commandExists(cmd: string): boolean {
  const bin = process.platform === 'win32' ? 'where' : 'which'
  return spawn([bin, cmd]).success
}

export type PromptsFn = {
  text: (opts: {
    message: string
    placeholder?: string
    defaultValue?: string
    validate?: (value: string) => string | void
  }) => Promise<string | symbol>
  password: (opts: {
    message: string
    validate?: (value: string) => string | void
  }) => Promise<string | symbol>
  select: <T>(opts: {
    message: string
    options: { value: T; label: string; hint?: string }[]
  }) => Promise<T | symbol>
  confirm: (opts: {
    message: string
    active?: string
    inactive?: string
  }) => Promise<boolean | symbol>
  spinner: () => {
    start: (msg?: string) => void
    stop: (msg?: string) => void
    message: (msg: string) => void
  }
  intro: (title?: string) => void
  outro: (message?: string) => void
  cancel: (message?: string) => void
  isCancel: (value: unknown) => value is symbol
  log: {
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
    success: (message: string) => void
    step: (message: string) => void
    message: (message: string) => void
  }
}

/** Factory that returns the real @clack/prompts bindings. */
export function defaultPrompts(): PromptsFn {
  return {
    text: clack.text,
    password: clack.password,
    select: clack.select,
    confirm: clack.confirm,
    spinner: clack.spinner,
    intro: clack.intro,
    outro: clack.outro,
    cancel: clack.cancel,
    isCancel: clack.isCancel,
    log: clack.log,
  } as PromptsFn
}
