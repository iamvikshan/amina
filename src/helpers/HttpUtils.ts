// src/helpers/HttpUtils.ts
import sourcebin from 'sourcebin_js'
import { error, debug } from '@helpers/Logger'
import fetch from 'node-fetch'

/**
 * HTTP response structure for JSON requests
 */
export interface JsonResponse<T = any> {
  success: boolean
  status?: number
  data?: T
}

/**
 * HTTP response structure for buffer requests
 */
export interface BufferResponse {
  success: boolean
  status?: number
  buffer?: Buffer
}

/**
 * Sourcebin response structure
 */
export interface BinResponse {
  url: string
  short: string
  raw: string
}

/**
 * HTTP utility class for making requests and posting to Sourcebin
 */
export default class HttpUtils {
  /**
   * Returns JSON response from url
   * @param url - The URL to fetch from
   * @param options - Optional fetch options
   */
  static async getJson<T = any>(
    url: string,
    options?: any
  ): Promise<JsonResponse<T>> {
    try {
      const response = options ? await fetch(url, options) : await fetch(url)
      const json = await response.json()
      return {
        success: response.status === 200 ? true : false,
        status: response.status,
        data: json as T,
      }
    } catch (ex) {
      debug(`Url: ${url}`)
      error(`getJson`, ex)
      return {
        success: false,
      }
    }
  }

  /**
   * Returns buffer from url
   * @param url - The URL to fetch from
   * @param options - Optional fetch options
   */
  static async getBuffer(url: string, options?: any): Promise<BufferResponse> {
    try {
      const response = options ? await fetch(url, options) : await fetch(url)
      const buffer = await response.buffer()
      if (response.status !== 200) debug(response)
      return {
        success: response.status === 200 ? true : false,
        status: response.status,
        buffer,
      }
    } catch (ex) {
      debug(`Url: ${url}`)
      error(`getBuffer`, ex)
      return {
        success: false,
      }
    }
  }

  /**
   * Posts the provided content to Sourcebin
   * @param content - The content to post
   * @param title - The title of the bin
   */
  static async postToBin(
    content: string,
    title: string
  ): Promise<BinResponse | undefined> {
    // Validate content before posting
    if (!content || content.trim().length === 0) {
      debug(`postToBin: Empty content provided for "${title}"`)
      return undefined
    }

    try {
      const response = await sourcebin.create(
        [
          {
            name: ' ',
            content,
            languageId: 'text',
          },
        ],
        {
          title,
          description: ' ',
        }
      )
      return {
        url: response.url,
        short: response.short,
        raw: `https://cdn.sourceb.in/bins/${response.key}/0`,
      }
    } catch (ex) {
      error(`postToBin`, ex)
      return undefined
    }
  }
}

// Named exports for backward compatibility with require() destructuring
export const getJson = HttpUtils.getJson.bind(HttpUtils)
export const getBuffer = HttpUtils.getBuffer.bind(HttpUtils)
export const postToBin = HttpUtils.postToBin.bind(HttpUtils)
