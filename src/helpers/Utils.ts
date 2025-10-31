// src/helpers/Utils.ts
import { COLORS } from '@src/data.json'
import { readdirSync, lstatSync } from 'fs'
import { join, extname } from 'path'
import permissions from './permissions'
import type { PermissionResolvable } from 'discord.js'

export default class Utils {
  /**
   * Checks if a string contains a URL
   * @param {string} text
   */
  static containsLink(text: string): boolean {
    return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/.test(
      text
    )
  }

  /**
   * Checks if a string is a valid discord invite
   * @param {string} text
   */
  static containsDiscordInvite(text: string): boolean {
    return /(https?:\/\/)?(www.)?(discord.(gg|io|me|li|link|plus)|discorda?p?p?.com\/invite|invite.gg|dsc.gg|urlcord.cf)\/[^\s/]+?(?=\b)/.test(
      text
    )
  }

  /**
   * Returns a random number below a max
   * @param {number} max
   */
  static getRandomInt(max: number): number {
    return Math.floor(Math.random() * max)
  }

  /**
   * Checks if a string is a valid Hex color
   * @param {string} text
   */
  static isHex(text: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(text)
  }

  /**
   * Checks if a string is a valid Hex color
   * @param {string} text
   */
  static isValidColor(text: string): boolean {
    if (COLORS.indexOf(text) > -1) {
      return true
    } else return false
  }

  /**
   * Returns hour difference between two dates
   * @param {Date} dt2
   * @param {Date} dt1
   */
  static diffHours(dt2: Date, dt1: Date): number {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000
    diff /= 60 * 60
    return Math.abs(Math.round(diff))
  }

  /**
   * Returns remaining time in days, hours, minutes and seconds
   * @param {number} timeInSeconds
   */
  static timeformat(timeInSeconds: number): string {
    const days = Math.floor((timeInSeconds % 31536000) / 86400)
    const hours = Math.floor((timeInSeconds % 86400) / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = Math.round(timeInSeconds % 60)
    return (
      (days > 0 ? `${days} days, ` : '') +
      (hours > 0 ? `${hours} hours, ` : '') +
      (minutes > 0 ? `${minutes} minutes, ` : '') +
      (seconds > 0 ? `${seconds} seconds` : '')
    )
  }

  /**
   * Converts duration to milliseconds
   * @param {string} duration
   */
  static durationToMillis(duration: string): number {
    return (
      duration
        .split(':')
        .map(Number)
        .reduce((acc, curr) => curr + acc * 60) * 1000
    )
  }

  /**
   * Returns time remaining until provided date
   * @param {Date} timeUntil
   */
  static getRemainingTime(timeUntil: Date): string {
    const seconds = Math.abs(
      (timeUntil.getTime() - new Date().getTime()) / 1000
    )
    const time = Utils.timeformat(seconds)
    return time
  }

  /**
   * Parse permissions array into readable format
   * @param {PermissionResolvable[]} perms
   */
  static parsePermissions(perms: PermissionResolvable[]): string {
    const permissionWord = `permission${perms.length > 1 ? 's' : ''}`
    return (
      '`' +
      perms
        .map(perm => permissions[perm as keyof typeof permissions])
        .join(', ') +
      '` ' +
      permissionWord
    )
  }

  /**
   * Recursively searches for a file in a directory
   * @param {string} dir
   * @param {string[]} allowedExtensions
   */
  static recursiveReadDirSync(
    dir: string,
    allowedExtensions: string[] = ['.js']
  ): string[] {
    const filePaths: string[] = []
    const readCommands = (dir: string) => {
      const files = readdirSync(join(process.cwd(), dir))
      files.forEach(file => {
        const stat = lstatSync(join(process.cwd(), dir, file))
        if (stat.isDirectory()) {
          readCommands(join(dir, file))
        } else {
          const extension = extname(file)
          if (!allowedExtensions.includes(extension)) return
          const filePath = join(process.cwd(), dir, file)
          filePaths.push(filePath)
        }
      })
    }
    readCommands(dir)
    return filePaths
  }

  /**
   * Formats milliseconds into days, hours, minutes, and seconds
   * @param {number} ms - Milliseconds
   * @returns {string} - Formatted time string
   */
  static formatTime(ms: number): string {
    return ms < 1000
      ? `${ms / 1000}s`
      : ['d', 'h', 'm', 's']
          .map((unit, i) => {
            const value = [864e5, 36e5, 6e4, 1e3][i]
            const amount = Math.floor(ms / value)
            ms %= value
            return amount ? `${amount}${unit}` : null
          })
          .filter(x => x !== null)
          .join(' ') || '0s'
  }

  /**
   * Parses a time string into milliseconds
   * @param {string} string - The time string (e.g., "1d", "2h", "3m", "4s")
   * @returns {number} - The time in milliseconds
   */
  static parseTime(string: string): number {
    const time = string.match(/([0-9]+[dhms])/g)
    if (!time) return 0
    return time.reduce((ms, t) => {
      const unit = t[t.length - 1] as 'd' | 'h' | 'm' | 's'
      const amount = Number(t.slice(0, -1))
      return ms + amount * { d: 864e5, h: 36e5, m: 6e4, s: 1e3 }[unit]
    }, 0)
  }

  /**
   * Updates voice channel status
   * @param {any} client - The bot client
   * @param {string} channelId - The voice channel ID
   * @param {string} message - The status to update
   */
  static async setVoiceStatus(
    client: any,
    channelId: string,
    message: string
  ): Promise<void> {
    const url = `/channels/${channelId}/voice-status`
    const payload = { status: message }
    await client.rest.put(url, { body: payload }).catch(() => {})
  }
}

// Named exports for CommonJS compatibility
export const containsLink = Utils.containsLink
export const containsDiscordInvite = Utils.containsDiscordInvite
export const getRandomInt = Utils.getRandomInt
export const isHex = Utils.isHex
export const isValidColor = Utils.isValidColor
export const diffHours = Utils.diffHours
export const timeformat = Utils.timeformat
export const durationToMillis = Utils.durationToMillis
export const getRemainingTime = Utils.getRemainingTime
export const parsePermissions = Utils.parsePermissions
export const recursiveReadDirSync = Utils.recursiveReadDirSync
export const formatTime = Utils.formatTime
export const parseTime = Utils.parseTime
export const setVoiceStatus = Utils.setVoiceStatus

