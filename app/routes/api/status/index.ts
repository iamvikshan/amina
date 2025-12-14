import { getUptimeStats } from '@/lib/uptime';
import type { Context } from 'hono';
import { createRoute } from 'honox/factory';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export const GET = createRoute(async (c: Context) => {
  try {
    const stats = await getUptimeStats();
    const totalMonitors = stats.monitors.length;
    const downMonitors = stats.monitors.filter(
      (monitor) => monitor.status !== 1
    ).length;

    const payload = {
      uptime: stats.uptime,
      totalMonitors,
      downMonitors,
      cached: stats.cached,
      cacheAge: stats.cached ? (stats.cacheAge ?? null) : null,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    console.error('[api/status] Failed to fetch uptime stats', error);

    return new Response(
      JSON.stringify({ error: 'Failed to load status information' }),
      {
        status: 500,
        headers: HEADERS,
      }
    );
  }
});
