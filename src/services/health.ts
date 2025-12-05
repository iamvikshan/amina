import Logger from '@helpers/Logger'
import config from '@src/config'

const PORT = config.SERVER.HEALTH_PORT

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/health' && req.method === 'GET') {
      return Response.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    }
    return new Response(null, { status: 404 })
  },
})

Logger.success(`[Health] Health check server running on port ${server.port}`)

// Handle graceful shutdown
const shutdown = () => {
  try {
    server.stop()
    try {
      Logger.success('Health server closed')
    } catch {
      console.log('Health server closed')
    }
    process.exit(0)
  } catch (error) {
    try {
      Logger.error('Error during health server shutdown:', error)
    } catch {
      console.error('Error during health server shutdown:', error)
    }
    process.exit(1)
  }
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
