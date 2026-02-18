/**
 * V1 Image Filters API
 *
 * SVG-based image filters. These use SVG filter elements
 * which work natively in browsers but may need conversion
 * for raster output.
 */

import { Hono } from 'hono'
import { requireApiKey, requirePermission } from '@middleware/auth'
import { errors } from '@lib/response'
import {
  getImageUrl,
  clampDimension,
  parseNumberOrDefault,
  svgResponse,
} from '@lib/svg-utils'

const filters = new Hono<{ Bindings: Env }>()

// Apply API key authentication
filters.use('*', requireApiKey)
filters.use('*', requirePermission('images'))

// SVG wrapper with filter
function createFilteredImage(
  imageUrl: string,
  filterId: string,
  filterDef: string,
  width = 512,
  height = 512
): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    ${filterDef}
  </defs>
  <image xlink:href="${imageUrl}" width="${width}" height="${height}" filter="url(#${filterId})" preserveAspectRatio="xMidYMid slice"/>
</svg>`
}

/**
 * GET /v1/images/filters/greyscale
 * Convert image to greyscale
 */
filters.get('/greyscale', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const intensity = parseNumberOrDefault(c.req.query('intensity'), 1, 0, 1)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="greyscale">
      <feColorMatrix type="saturate" values="${1 - Math.min(1, Math.max(0, intensity))}"/>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'greyscale', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/blur
 * Apply blur effect
 */
filters.get('/blur', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const radius = parseNumberOrDefault(c.req.query('radius'), 5, 0, 50)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="blur">
      <feGaussianBlur stdDeviation="${radius}"/>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'blur', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/sepia
 * Apply sepia filter
 */
filters.get('/sepia', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const intensity = parseNumberOrDefault(c.req.query('intensity'), 1, 0, 1)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  // Sepia color matrix
  const filter = `
    <filter id="sepia">
      <feColorMatrix type="matrix" values="
        ${0.393 + 0.607 * (1 - intensity)} ${0.769 * intensity} ${0.189 * intensity} 0 0
        ${0.349 * intensity} ${0.686 + 0.314 * (1 - intensity)} ${0.168 * intensity} 0 0
        ${0.272 * intensity} ${0.534 * intensity} ${0.131 + 0.869 * (1 - intensity)} 0 0
        0 0 0 1 0
      "/>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'sepia', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/invert
 * Invert colors
 */
filters.get('/invert', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="invert">
      <feColorMatrix type="matrix" values="
        -1 0 0 0 1
        0 -1 0 0 1
        0 0 -1 0 1
        0 0 0 1 0
      "/>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'invert', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/brighten
 * Brighten an image
 */
filters.get('/brighten', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const amount = parseNumberOrDefault(c.req.query('amount'), 1.3, 0, 2)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="brighten">
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}"/>
        <feFuncG type="linear" slope="${amount}"/>
        <feFuncB type="linear" slope="${amount}"/>
      </feComponentTransfer>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'brighten', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/darken
 * Darken an image
 */
filters.get('/darken', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const amount = parseNumberOrDefault(c.req.query('amount'), 0.7, 0, 1)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="darken">
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}"/>
        <feFuncG type="linear" slope="${amount}"/>
        <feFuncB type="linear" slope="${amount}"/>
      </feComponentTransfer>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'darken', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/contrast
 * Adjust contrast
 */
filters.get('/contrast', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const amount = parseNumberOrDefault(c.req.query('amount'), 1.5, 0, 3)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const intercept = 0.5 * (1 - amount)

  const filter = `
    <filter id="contrast">
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}" intercept="${intercept}"/>
        <feFuncG type="linear" slope="${amount}" intercept="${intercept}"/>
        <feFuncB type="linear" slope="${amount}" intercept="${intercept}"/>
      </feComponentTransfer>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'contrast', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/pixelate
 * Pixelate effect (approximation using SVG)
 */
filters.get('/pixelate', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const pixels = parseNumberOrDefault(c.req.query('pixels'), 10, 2, 50)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  // Use a small image and scale up with no smoothing
  const scale = 1 / pixels

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="image-rendering: pixelated;">
  <defs>
    <pattern id="pixelate-pattern" width="${w * scale}" height="${h * scale}" patternUnits="userSpaceOnUse">
      <image xlink:href="${imageUrl}" width="${w * scale}" height="${h * scale}" preserveAspectRatio="xMidYMid slice"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#pixelate-pattern)" style="image-rendering: pixelated;"/>
</svg>`

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/saturate
 * Adjust saturation
 */
filters.get('/saturate', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const amount = parseNumberOrDefault(c.req.query('amount'), 1.5, 0, 3)
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="saturate">
      <feColorMatrix type="saturate" values="${amount}"/>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'saturate', filter, w, h)

  return svgResponse(svg)
})

/**
 * GET /v1/images/filters/hue-rotate
 * Rotate hue
 */
filters.get('/hue-rotate', async c => {
  const imageUrl = getImageUrl(c)
  if (!imageUrl) {
    return errors.badRequest(c, 'Missing or invalid image URL')
  }

  const degrees =
    ((parseNumberOrDefault(c.req.query('degrees') || c.req.query('angle'), 90) %
      360) +
      360) %
    360
  const w = clampDimension(
    parseNumberOrDefault(c.req.query('width'), 512, 1, 2048)
  )
  const h = clampDimension(
    parseNumberOrDefault(c.req.query('height'), 512, 1, 2048)
  )

  const filter = `
    <filter id="hue-rotate">
      <feColorMatrix type="hueRotate" values="${degrees}"/>
    </filter>
  `

  const svg = createFilteredImage(imageUrl, 'hue-rotate', filter, w, h)

  return svgResponse(svg)
})

export default filters
