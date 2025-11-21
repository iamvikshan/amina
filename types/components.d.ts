/* eslint-disable @typescript-eslint/no-unused-vars */
// Component helper type definitions

declare global {
  interface ButtonOptions {
    customId: string
    label: string
    emoji?: string
    disabled?: boolean
  }

  interface LinkButtonOptions {
    url: string
    label: string
    emoji?: string
    disabled?: boolean
  }
}

export {}

