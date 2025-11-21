declare module 'discord-gamecord' {
  export class Hangman {
    constructor(options: any)
    startGame(): void
    on(event: string, callback: (result: any) => void): void
    win(): void
    lose(): void
  }

  export class TicTacToe {
    constructor(options: any)
    startGame(): void
    on(event: string, callback: (result: any) => void): void
  }
}
