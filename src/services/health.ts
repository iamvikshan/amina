import * as http from 'http'

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    )
  } else {
    res.writeHead(404)
    res.end()
  }
})

const PORT = process.env.HEALTH_PORT || 3000

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[Health] Port ${PORT} is already in use. Skipping health server.`
    )
  } else {
    console.error('[Health] Failed to start server:', err.message)
  }
})

server.listen(PORT, () => {
  console.log(`[Health] Health check server running on port ${PORT}`)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Health server closed')
  })
})
