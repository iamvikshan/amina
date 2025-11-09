// @/lib/uptime.ts
// Uptime Kuma API integration for real-time uptime statistics
// Fetches all monitors from https://status.vikshan.me/status/amina and filters by "amina" prefix

export interface Monitor {
  id: number;
  name: string;
  status: number; // 0 = down, 1 = up, 2 = pending
  uptime: number; // Percentage (0-100)
}

// Cache interface
interface UptimeCache {
  uptime: number;
  monitors: Monitor[];
  timestamp: number;
}

// In-memory cache (10 minute TTL to match bot stats update frequency)
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let uptimeCache: UptimeCache | null = null;

export interface UptimeStats {
  uptime: number; // Average percentage (0-100)
  monitors: Monitor[]; // Individual monitor data
  cached: boolean;
  cacheAge?: number; // in seconds
}

/**
 * Fetch uptime statistics from Uptime Kuma Status Page API
 * Fetches ALL monitors from the status page
 * Filters by "amina" prefix for uptime percentage calculation (bot, dash, docs)
 * But returns all monitors for status pill usage (includes lavalinks)
 */
async function fetchUptimeFromKuma(): Promise<{
  uptime: number;
  monitors: Monitor[];
}> {
  // Hardcoded configuration
  const uptimeKumaUrl = 'https://status.vikshan.me';
  const statusPageSlug = 'amina';
  const aminaPrefix = 'amina'; // For uptime calculation: bot, dash, docs

  // First, fetch status page to get monitor list
  const statusPageResponse = await fetch(
    `${uptimeKumaUrl}/api/status-page/${statusPageSlug}`
  );

  if (!statusPageResponse.ok) {
    throw new Error(`Uptime Kuma API error: ${statusPageResponse.status}`);
  }

  const statusPageData = await statusPageResponse.json();
  const publicGroupList = statusPageData.publicGroupList || [];

  // Extract all monitors from all groups
  const monitorList: any[] = [];
  for (const group of publicGroupList) {
    if (group.monitorList && Array.isArray(group.monitorList)) {
      monitorList.push(...group.monitorList);
    }
  }

  if (monitorList.length === 0) {
    return { uptime: 99.9, monitors: [] };
  }

  // Now fetch heartbeat/uptime data
  const heartbeatResponse = await fetch(
    `${uptimeKumaUrl}/api/status-page/heartbeat/${statusPageSlug}`
  );

  if (!heartbeatResponse.ok) {
    throw new Error(`Uptime Kuma API error: ${heartbeatResponse.status}`);
  }

  const heartbeatData = await heartbeatResponse.json();
  const uptimeList = heartbeatData.uptimeList || {};
  const heartbeatList = heartbeatData.heartbeatList || {};

  const allMonitors: Monitor[] = [];
  let aminaUptimeTotal = 0;
  let aminaCount = 0;

  // Process ALL monitors
  for (const monitor of monitorList) {
    const id = Number(monitor.id);
    const name = String(monitor.name);
    const type = String(monitor.type || 'unknown');

    // Skip group monitors - they're virtual aggregates, not real monitors
    if (type === 'group') {
      continue;
    }

    // Get current status from latest heartbeat
    const heartbeats = heartbeatList[id];
    let status = 1; // default to up
    if (heartbeats && Array.isArray(heartbeats) && heartbeats.length > 0) {
      // Get the latest heartbeat status
      status = Number(heartbeats[heartbeats.length - 1].status || 1);
    }

    // Get 24h uptime from uptimeList
    const key = `${id}_24`;
    const uptimeValue = uptimeList[key];
    const monitorUptime =
      typeof uptimeValue === 'number' ? uptimeValue * 100 : 99.9;

    allMonitors.push({ id, name, status, uptime: monitorUptime });

    // Calculate uptime ONLY for "amina" prefixed monitors (bot, dash, docs)
    if (name.toLowerCase().startsWith(aminaPrefix.toLowerCase())) {
      aminaUptimeTotal += monitorUptime;
      aminaCount++;
    }
  }

  // Average uptime from amina monitors only
  const averageUptime = aminaCount > 0 ? aminaUptimeTotal / aminaCount : 99.9;

  return {
    uptime: Math.round(averageUptime * 10) / 10, // Round to 1 decimal
    monitors: allMonitors, // Return ALL monitors
  };
}

/**
 * Get uptime statistics with caching
 * Returns average uptime percentage and individual monitor data
 * Uses 10-minute cache to match bot stats update frequency
 */
export async function getUptimeStats(): Promise<UptimeStats> {
  // Check cache first
  if (uptimeCache && Date.now() - uptimeCache.timestamp < CACHE_DURATION) {
    const cacheAge = Math.round((Date.now() - uptimeCache.timestamp) / 1000);
    return {
      uptime: uptimeCache.uptime,
      monitors: uptimeCache.monitors,
      cached: true,
      cacheAge,
    };
  }

  try {
    const data = await fetchUptimeFromKuma();

    // Update cache
    uptimeCache = {
      uptime: data.uptime,
      monitors: data.monitors,
      timestamp: Date.now(),
    };

    return {
      uptime: data.uptime,
      monitors: data.monitors,
      cached: false,
    };
  } catch (error) {
    console.error('[getUptimeStats] Error fetching uptime:', error);

    // If we have stale cache, return it as fallback
    if (uptimeCache) {
      return {
        uptime: uptimeCache.uptime,
        monitors: uptimeCache.monitors,
        cached: true,
        cacheAge: Math.round((Date.now() - uptimeCache.timestamp) / 1000),
      };
    }

    // No cache available, return default
    return {
      uptime: 99.9,
      monitors: [],
      cached: false,
    };
  }
}

/**
 * Clear the uptime cache (useful for testing or manual refresh)
 */
export function clearUptimeCache(): void {
  uptimeCache = null;
}
