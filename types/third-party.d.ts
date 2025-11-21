/* eslint-disable @typescript-eslint/no-unused-vars */
// Third-party package type declarations

declare module 'common-tags' {
  export function stripIndent(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function stripIndents(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function oneLine(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function oneLineTrim(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function html(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function codeBlock(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function inlineCode(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function source(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function commaLists(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function commaListsOr(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function commaListsAnd(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function id(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function safeHtml(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string
  export function TemplateTag(
    fn: (str: string) => string
  ): (strings: TemplateStringsArray, ...values: any[]) => string
  export const defaultExport: typeof stripIndent
}

declare module 'discord-gamecord' {
  import type { Message, TextChannel, User } from 'discord.js'

  export interface GameOptions {
    message: Message
    opponent: User
    embed?: {
      title?: string
      color?: string
      description?: string
    }
    buttons?: {
      [key: string]: string
    }
    winMessage?: string
    loseMessage?: string
    othersMessage?: string
    timeoutTime?: number
    playerOnly?: boolean
  }

  export class Hangman {
    constructor(options: GameOptions)
    startGame(): Promise<void>
  }

  export class TicTacToe {
    constructor(options: GameOptions)
    startGame(): Promise<void>
  }

  // Add other game classes as needed
  export class Connect4 {
    constructor(options: GameOptions)
    startGame(): Promise<void>
  }

  export class RockPaperScissors {
    constructor(options: GameOptions)
    startGame(): Promise<void>
  }

  export class Snake {
    constructor(options: GameOptions)
    startGame(): Promise<void>
  }

  export class Wordle {
    constructor(options: GameOptions)
    startGame(): Promise<void>
  }
}

declare module 'sourcebin_js' {
  export interface CreateOptions {
    title?: string
    description?: string
    files: Array<{
      name: string
      content: string
      languageId?: string | number
    }>
  }

  export interface SourceBin {
    key: string
    url: string
    short: string
    raw: string
  }

  export function create(options: CreateOptions): Promise<SourceBin>
  export function get(key: string): Promise<SourceBin>
}

declare module 'node-fetch' {
  import { Readable } from 'stream'

  export interface RequestInit {
    method?: string
    headers?: Record<string, string>
    body?: string | Buffer | Readable
    redirect?: 'follow' | 'error' | 'manual'
    signal?: AbortSignal
    timeout?: number
  }

  export interface Response {
    ok: boolean
    status: number
    statusText: string
    headers: Headers
    url: string
    redirected: boolean
    type: string
    size: number
    timeout: number
    body: Readable
    bodyUsed: boolean
    arrayBuffer(): Promise<ArrayBuffer>
    blob(): Promise<Blob>
    json(): Promise<any>
    text(): Promise<string>
    buffer(): Promise<Buffer>
    clone(): Response
  }

  export class Headers {
    constructor(init?: HeadersInit | Record<string, string>)
    append(name: string, value: string): void
    delete(name: string): void
    get(name: string): string | null
    has(name: string): boolean
    set(name: string, value: string): void
    forEach(callback: (value: string, name: string) => void): void
    entries(): IterableIterator<[string, string]>
    keys(): IterableIterator<string>
    values(): IterableIterator<string>
  }

  export default function fetch(
    url: string | URL,
    init?: RequestInit
  ): Promise<Response>
}

export {}

