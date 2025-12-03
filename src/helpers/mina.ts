// @root/src/helpers/mina.ts
// Central helper for mina's voice, responses, colors, and quotes

import responses from '@data/responses'
import colors from '@data/colors.json' with { type: 'json' }
import { secret } from '@src/config/secrets'

// Types for the response system
type EmoticonMood = keyof typeof responses.emoticons

interface Quote {
  quote: string
  anime: string
  character: string
}

interface WaifuItQuoteResponse {
  status: number
  quote: string
  anime: string
  character: string
}

// Cache for quotes to reduce API calls
let quotesCache: Quote[] = []
let lastQuoteFetch = 0
const QUOTE_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * Fetch quotes from waifu.it API
 */
async function fetchQuotes(): Promise<Quote[]> {
  const now = Date.now()

  // Return cached quotes if still valid
  if (quotesCache.length > 0 && now - lastQuoteFetch < QUOTE_CACHE_TTL) {
    return quotesCache
  }

  const apiKey = secret.WAIFU_IT
  if (!apiKey) {
    console.warn(
      '[mina] WAIFU_IT API key not configured, using fallback quotes'
    )
    return getFallbackQuotes()
  }

  try {
    const response = await fetch('https://waifu.it/api/v4/quote', {
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      console.error(`[mina] waifu.it API error: ${response.status}`)
      return getFallbackQuotes()
    }

    const data = (await response.json()) as WaifuItQuoteResponse

    // API returns single quote, add to cache
    if (data.quote) {
      const newQuote: Quote = {
        quote: data.quote,
        anime: data.anime || 'unknown',
        character: data.character || 'unknown',
      }

      // Add to cache, keep max 50 quotes
      quotesCache.push(newQuote)
      if (quotesCache.length > 50) {
        quotesCache.shift()
      }
      lastQuoteFetch = now
    }

    return quotesCache.length > 0 ? quotesCache : getFallbackQuotes()
  } catch (error) {
    console.error('[mina] Failed to fetch quotes:', error)
    return getFallbackQuotes()
  }
}

/**
 * Fallback quotes when API is unavailable
 */
function getFallbackQuotes(): Quote[] {
  return [
    {
      quote: 'the only ones who should kill are those prepared to be killed.',
      anime: 'code geass',
      character: 'lelouch',
    },
    {
      quote: 'people die when they are killed.',
      anime: 'fate/stay night',
      character: 'shirou',
    },
    {
      quote: "if you don't take risks, you can't create a future.",
      anime: 'one piece',
      character: 'luffy',
    },
    {
      quote: "the world isn't perfect. but it's there for us.",
      anime: 'fma',
      character: 'roy mustang',
    },
    {
      quote: 'a lesson without pain is meaningless.',
      anime: 'fma',
      character: 'edward elric',
    },
    {
      quote: 'power comes in response to a need, not a desire.',
      anime: 'dbz',
      character: 'goku',
    },
    {
      quote: 'reject common sense to make the impossible possible.',
      anime: 'gurren lagann',
      character: 'simon',
    },
    {
      quote: "i'll take a potato chip... and eat it!",
      anime: 'death note',
      character: 'light yagami',
    },
    {
      quote:
        "hard work is worthless for those that don't believe in themselves.",
      anime: 'naruto',
      character: 'naruto',
    },
    {
      quote:
        "it's not the face that makes someone a monster, it's the choices they make.",
      anime: 'naruto',
      character: 'naruto',
    },
    {
      quote:
        "whatever you lose, you'll find it again. but what you throw away you'll never get back.",
      anime: 'fma',
      character: 'kimblee',
    },
    {
      quote: 'fear is not evil. it tells you what your weakness is.',
      anime: 'fairy tail',
      character: 'gildarts',
    },
    {
      quote:
        'the moment you think of giving up, think of the reason why you held on so long.',
      anime: 'natsu',
      character: 'fairy tail',
    },
    {
      quote:
        "if you don't share someone's pain, you can never understand them.",
      anime: 'naruto',
      character: 'nagato',
    },
    {
      quote: 'being lonely is more painful than getting hurt.',
      anime: 'naruto',
      character: 'luffy',
    },
  ]
}

/**
 * Get a random item from an array
 */
function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Main mina helper object
 */
export const mina = {
  /**
   * Get random response from category
   * Supports dot notation for nested paths: 'music.error.notPlaying'
   * @param path - Dot-separated path (e.g., 'success', 'music.error.notPlaying')
   */
  say: (path: string): string => {
    try {
      const data = responses as Record<string, any>
      const parts = path.split('.')

      let pool: any = data
      for (const part of parts) {
        pool = pool?.[part]
        if (pool === undefined) break
      }

      if (Array.isArray(pool) && pool.length > 0) {
        return random(pool)
      }

      // If it's a string, return it directly (for single-value entries)
      if (typeof pool === 'string') {
        return pool
      }

      return 'hmm.'
    } catch {
      return 'hmm.'
    }
  },

  /**
   * Legacy version with category/subcategory params
   * @deprecated Use say('category.subcategory') instead
   */
  sayLegacy: (category: string, subcategory?: string): string => {
    try {
      const data = responses as Record<string, any>
      const pool = subcategory ? data[category]?.[subcategory] : data[category]

      if (!Array.isArray(pool) || pool.length === 0) {
        return 'hmm.'
      }
      return random(pool)
    } catch {
      return 'hmm.'
    }
  },

  /**
   * Get random emoticon by mood
   */
  emote: (mood: EmoticonMood): string => {
    const pool = responses.emoticons[mood]
    if (!Array.isArray(pool) || pool.length === 0) {
      return ': )'
    }
    return random(pool)
  },

  /**
   * Get random anime quote (async - fetches from API)
   * Returns full quote (no truncation)
   */
  quote: async (): Promise<{ text: string; source: string }> => {
    try {
      const quotes = await fetchQuotes()
      const q = random(quotes)

      return {
        text: q.quote.toLowerCase(),
        source: `${q.character} - ${q.anime}`.toLowerCase(),
      }
    } catch {
      return {
        text: 'the only ones who should kill are those prepared to be killed.',
        source: 'lelouch - code geass',
      }
    }
  },

  /**
   * Get random anime quote (sync - uses cache/fallback only)
   * Use this when you can't await
   */
  quoteSync: (): { text: string; source: string } => {
    const quotes = quotesCache.length > 0 ? quotesCache : getFallbackQuotes()
    const q = random(quotes)

    return {
      text: q.quote.toLowerCase(),
      source: `${q.character} - ${q.anime}`.toLowerCase(),
    }
  },

  /**
   * Get random tip
   */
  tip: (): string => {
    return random(responses.tips)
  },

  /**
   * Get random filler response
   */
  filler: (): string => {
    return random(responses.filler)
  },

  /**
   * Template replacement - replaces {var} with values
   * @param template - String with {placeholders}
   * @param vars - Key-value pairs to replace
   */
  format: (template: string, vars: Record<string, string | number>): string => {
    return template.replace(/{(\w+)}/g, (_, key) => {
      const value = vars[key]
      return value !== undefined ? String(value) : `{${key}}`
    })
  },

  /**
   * Combine say + format for convenience
   * @param path - Dot-separated path (e.g., 'music.success.shuffled')
   * @param vars - Variables to substitute
   */
  sayf: (path: string, vars: Record<string, string | number>): string => {
    const template = mina.say(path)
    return mina.format(template, vars)
  },

  /**
   * Color getters
   */
  color: colors.embed as {
    primary: string
    secondary: string
    success: string
    error: string
    warning: string
    info: string
    gold: string
    muted: string
  },

  palette: colors.palette as Record<string, string>,

  modColors: colors.moderation as Record<string, string>,

  featureColors: colors.features as Record<string, string>,

  /**
   * Get color by name (flexible lookup)
   */
  getColor: (name: string): string => {
    // Check embed colors first
    if (name in colors.embed) {
      return (colors.embed as Record<string, string>)[name]
    }
    // Check palette
    if (name in colors.palette) {
      return (colors.palette as Record<string, string>)[name]
    }
    // Check moderation
    if (name in colors.moderation) {
      return (colors.moderation as Record<string, string>)[name]
    }
    // Check features
    if (name in colors.features) {
      return (colors.features as Record<string, string>)[name]
    }
    // Default to primary
    return colors.embed.primary
  },

  // ============================================
  // MARKDOWN FORMATTERS
  // ============================================

  /**
   * Create a markdown link
   */
  link: (text: string, url: string): string => `[${text}](${url})`,

  /**
   * Italicize text
   */
  italic: (text: string): string => `*${text}*`,

  /**
   * Bold text
   */
  bold: (text: string): string => `**${text}**`,

  /**
   * Bold + italic
   */
  boldItalic: (text: string): string => `***${text}***`,

  /**
   * Strikethrough text
   */
  strike: (text: string): string => `~~${text}~~`,

  /**
   * Underline text
   */
  underline: (text: string): string => `__${text}__`,

  /**
   * Spoiler text
   */
  spoiler: (text: string): string => `||${text}||`,

  /**
   * Inline code
   */
  code: (text: string): string => `\`${text}\``,

  /**
   * Code block with optional language
   */
  codeBlock: (text: string, lang = ''): string =>
    `\`\`\`${lang}\n${text}\n\`\`\``,

  /**
   * Block quote (discord style)
   */
  blockQuote: (text: string): string => `> ${text}`,

  /**
   * Multi-line block quote
   */
  blockQuoteMulti: (text: string): string => `>>> ${text}`,
}

// Pre-warm the quote cache on module load (non-blocking)
fetchQuotes().catch(() => {})

export default mina
