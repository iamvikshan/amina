import { getBotStats } from '@lib/bot-stats';
import { getUptimeStats } from '@lib/uptime';
import type { Context } from 'hono';
import { createRoute } from 'honox/factory';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export const GET = createRoute(async (c: Context) => {
  try {
    const [botStats, uptimeStats] = await Promise.all([
      getBotStats(),
      getUptimeStats(),
    ]);

    const payload = {
      guilds: botStats.guildCount,
      members: botStats.memberCount,
      uptime: uptimeStats.uptime,
      ping: botStats.ping,
      status: botStats.status,
      cached: botStats.cached || uptimeStats.cached,
      cacheAge: Math.max(
        botStats.cacheAge ?? 0,
        uptimeStats.cached ? (uptimeStats.cacheAge ?? 0) : 0
      ),
      generatedAt: new Date().toISOString(),
      channels: botStats.channels,
      uptimeHours: botStats.uptimeHours,
      presence: botStats.presence,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    console.error('[api/metrics] Failed to fetch metrics', error);

    return new Response(JSON.stringify({ error: 'Failed to load metrics' }), {
      status: 500,
      headers: HEADERS,
    });
  }
});
