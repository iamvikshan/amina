import type { APIRoute } from 'astro';
import { getUptimeStats } from '@/lib/uptime';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  // Allow shared cache layers (CDNs, proxies) to reuse the value for 60 seconds
  // and keep a stale response around for 5 minutes while revalidating.
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export const GET: APIRoute = async () => {
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
      cacheAge: stats.cacheAge ?? null,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    console.error('[api/status] Failed to fetch uptime stats', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to load status information',
      }),
      {
        status: 500,
        headers: HEADERS,
      }
    );
  }
};
