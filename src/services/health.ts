if (import.meta.main) {
  const port = Number(process.env.HEALTH_PORT) || 3000
  try {
    const res = await fetch(`http://localhost:${port}/health`)
    const data = (await res.json()) as { status: string }
    if (data.status === 'ok') {
      console.log(`Health check passed (port ${port})`)
      process.exit(0)
    }
    console.error(`Health check failed (port ${port}): status=${data.status}`)
    process.exit(1)
  } catch (err) {
    console.error(
      `Health check failed (port ${port}):`,
      err instanceof Error ? err.message : err
    )
    process.exit(1)
  }
}

let server: ReturnType<typeof Bun.serve> | undefined

export type HealthServerStopResult =
  | { ok: true }
  | { ok: false; error: unknown }

export async function startHealthServer() {
  if (server) return server

  const { default: config } = await import('@src/config/config')

  const PORT = config.SERVER.HEALTH_PORT

  server = Bun.serve({
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

  return server
}

export async function stopHealthServer(): Promise<HealthServerStopResult> {
  const activeServer = server

  if (!activeServer) {
    return { ok: true }
  }

  let Logger:
    | {
        success(content: string): void
        error(content: string, error?: unknown): void
      }
    | undefined

  try {
    ;({ default: Logger } = await import('@helpers/Logger'))
  } catch {
    Logger = undefined
  }

  try {
    await activeServer.stop()

    try {
      Logger?.success('Health server closed')
    } catch {
      console.log('Health server closed')
    }

    return { ok: true }
  } catch (error) {
    try {
      Logger?.error('Error during health server shutdown', error)
    } catch {
      console.error('Error during health server shutdown', error)
    }

    return { ok: false, error }
  } finally {
    server = undefined
  }
}
