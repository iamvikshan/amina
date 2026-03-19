import { spawnSync } from 'node:child_process'
import chalk from 'chalk'
import * as clack from '@clack/prompts'

// Amina brand palette (Akame ga Kill inspired)
export const crimson = chalk.hex('#dc143c')
export const bloodRed = chalk.hex('#8b0000')
export const roseRed = chalk.hex('#e63946')
export const electricBlue = chalk.hex('#1e90ff')
export const cyberBlue = chalk.hex('#00ced1')
export const gold = chalk.hex('#ffd700')
export const amberGold = chalk.hex('#ffa500')
export const green = chalk.hex('#57f287')
export const dim = chalk.dim

export function header(msg: string): void {
  console.log(electricBlue.bold(`\n--- ${msg} ---`))
}

export function log(message: string): void {
  console.log(`${electricBlue('[*]')} ${message}`)
}

export function warn(message: string): void {
  console.warn(`${amberGold('[!]')} ${message}`)
}

export function error(message: string): void {
  console.error(`${crimson('[x]')} ${message}`)
}

export function success(message: string): void {
  console.log(`${green('[+]')} ${message}`)
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
