// @/lib/uptime.ts
// Instatus API integration for real-time status monitoring
// Fetches component statuses from https://mina.instatus.com

import { env } from '@/env';
import type { InstatusComponent, Monitor, UptimeStats } from '@types';

// Cache interface
interface UptimeCache {
  uptime: number;
  monitors: Monitor[];
  timestamp: number;
}

// In-memory cache (10 minute TTL to match bot stats update frequency)
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const API_TIMEOUT = 5000; // 5 seconds timeout for Instatus API requests
let uptimeCache: UptimeCache | null = null;

/**
 * Fetch status from Instatus API
 * Fetches ALL components from the status page
 * Returns randomized uptime percentage as placeholder until custom tracking is implemented
 */
async function fetchStatusFromInstatus(): Promise<{
  uptime: number;
  monitors: Monitor[];
}> {
  const INSTATUS_PAGE_ID = 'cmit175ob0cuj11tt00sf2iq9';
  const apiKey = env.INSTATUS_API;

  if (!apiKey) {
    console.warn('[uptime] INSTATUS_API not configured, using fallback');
    return { uptime: 99.95, monitors: [] };
  }

  // Setup AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // Fetch components from Instatus with timeout
    const response = await fetch(
      `https://api.instatus.com/v2/${INSTATUS_PAGE_ID}/components`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Instatus API error: ${response.status}`);
    }

    const result = await response.json();

    // Runtime validation of the API response
    if (!Array.isArray(result)) {
      console.error(
        '[uptime] Instatus API response is not an array:',
        typeof result
      );
      return { uptime: 99.95, monitors: [] };
    }

    if (result.length === 0) {
      console.warn('[uptime] Instatus API returned empty components array');
      return { uptime: 99.95, monitors: [] };
    }

    // Validate each component has required properties
    const validComponents: InstatusComponent[] = [];
    const validStatuses = [
      'OPERATIONAL',
      'UNDERMAINTENANCE',
      'DEGRADEDPERFORMANCE',
      'PARTIALOUTAGE',
      'MAJOROUTAGE',
    ];

    for (let i = 0; i < result.length; i++) {
      const component = result[i];

      // Check required properties exist and have correct types
      if (
        typeof component === 'object' &&
        component !== null &&
        typeof component.id === 'string' &&
        typeof component.name === 'string' &&
        typeof component.status === 'string' &&
        validStatuses.includes(component.status)
      ) {
        validComponents.push(component as InstatusComponent);
      } else {
        console.warn(`[uptime] Invalid component at index ${i}:`, component);
      }
    }

    if (validComponents.length === 0) {
      console.error(
        '[uptime] No valid components found in Instatus API response'
      );
      return { uptime: 99.95, monitors: [] };
    }

    const components = validComponents;

    // Map components to monitors
    const monitors: Monitor[] = components.map((component) => ({
      id: component.id,
      name: component.name,
      // Map Instatus status to numeric: OPERATIONAL=1, anything else=0
      status: component.status === 'OPERATIONAL' ? 1 : 0,
      // Placeholder uptime - will be replaced with custom bot tracking later
      uptime: 99.95,
    }));

    // Generate randomized uptime percentage (99.XX%)
    // This is a placeholder until custom bot→API uptime tracking is implemented
    const randomDecimal = Math.floor(Math.random() * 100); // 00-99
    const placeholderUptime = 99 + randomDecimal / 100; // 99.00 - 99.99

    return {
      uptime: Math.round(placeholderUptime * 100) / 100, // Round to 2 decimals
      monitors,
    };
  } catch (error) {
    // Handle abort/timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Instatus API request timed out after ${API_TIMEOUT}ms`);
    }
    throw error;
  } finally {
    // Always clear the timeout
    clearTimeout(timeoutId);
  }
}

/**
 * Get uptime statistics with caching
 * Returns placeholder uptime percentage and component status data
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
    const data = await fetchStatusFromInstatus();

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
    console.error('[getUptimeStats] Error fetching status:', error);

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
      uptime: 99.95,
      monitors: [],
      cached: false,
    };
  }
}
