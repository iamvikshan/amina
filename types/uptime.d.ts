// Uptime and Monitoring Types

// Instatus API response shape
export interface InstatusComponent {
  id: string;
  name: string;
  status:
    | 'OPERATIONAL'
    | 'UNDERMAINTENANCE'
    | 'DEGRADEDPERFORMANCE'
    | 'PARTIALOUTAGE'
    | 'MAJOROUTAGE';
}

export interface Monitor {
  id: string;
  name: string;
  /** Monitor operational status: 1 = operational, 0 = down/degraded or other incident status */
  status: number;
  /** Uptime percentage as a number from 0 to 100 with up to two decimal places (e.g., 99.95) */
  uptime: number;
}

export type UptimeStats =
  | {
      /** Overall uptime percentage as a number from 0 to 100 with up to two decimal places (e.g., 99.95). Populated after API fetch from Instatus. */
      uptime: number;
      /** Individual monitor data array with status and uptime metrics for each component */
      monitors: Monitor[];
      /** Indicates whether this data is cached (true) or freshly fetched (false) */
      cached: false;
    }
  | {
      /** Overall uptime percentage as a number from 0 to 100 with up to two decimal places (e.g., 99.95). Populated after API fetch from Instatus. */
      uptime: number;
      /** Individual monitor data array with status and uptime metrics for each component */
      monitors: Monitor[];
      /** Indicates whether this data is cached (true) or freshly fetched (false) */
      cached: true;
      /** Age of the cached data in seconds. Only present if cached is true. Represents time elapsed since last successful API fetch. */
      cacheAge?: number;
    };
