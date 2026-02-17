/**
 * Bot KV Operations
 *
 * CRUD operations for bot data stored in Cloudflare KV
 */

// ============================================================================
// Bot Metadata Operations
// ============================================================================

/**
 * Get bot metadata by client ID
 */
export async function getBotMeta(
  kv: KVNamespace,
  clientId: string
): Promise<BotMeta | null> {
  const key = `bot:${clientId}:meta`;
  const data = await kv.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (err) {
    console.error(
      `Error parsing bot meta for clientId ${clientId} (key: ${key}):`,
      err
    );
    return null;
  }
}

/**
 * Update bot metadata
 */
export async function updateBotMeta(
  kv: KVNamespace,
  clientId: string,
  updates: Partial<BotMeta>
): Promise<void> {
  const existing = await getBotMeta(kv, clientId);

  if (!existing) {
    throw new Error('Bot not found');
  }

  const updated: BotMeta = {
    ...existing,
    ...updates,
    clientId, // Ensure clientId can't be changed
  };

  await kv.put(`bot:${clientId}:meta`, JSON.stringify(updated));
}

/**
 * Update bot's lastSeen timestamp (heartbeat)
 */
export async function updateBotHeartbeat(
  kv: KVNamespace,
  clientId: string
): Promise<void> {
  await updateBotMeta(kv, clientId, {
    lastSeen: new Date().toISOString(),
  });
}

/**
 * List all registered bots
 */
export async function listBots(
  kv: KVNamespace,
  options: {
    publicOnly?: boolean;
    ownerId?: string;
    limit?: number;
    page?: number;
  } = {}
): Promise<BotMeta[]> {
  // Collect all meta keys across KV pages
  const metaKeys: { name: string }[] = [];
  let cursor: string | undefined;
  let pageCount = 0;

  do {
    try {
      const list = await kv.list({
        prefix: 'bot:',
        cursor,
        limit: 1000, // KV list limit per page
      });

      // Filter for meta keys only from this page
      const pageMetaKeys = list.keys.filter((k) => k.name.endsWith(':meta'));
      metaKeys.push(...pageMetaKeys);

      cursor = list.list_complete ? undefined : list.cursor;
      pageCount++;

      // Safety check to prevent infinite loops
      if (pageCount > 100) {
        console.warn('listBots: Exceeded maximum KV pages, truncating results');
        break;
      }
    } catch (err) {
      console.error(`Failed to list KV page ${pageCount}:`, err);
      // Continue with what we have rather than failing completely
      break;
    }
  } while (cursor);

  // Fetch all meta values in batches to avoid overwhelming KV
  const BATCH_SIZE = 50;
  const results: (string | null)[] = [];

  for (let i = 0; i < metaKeys.length; i += BATCH_SIZE) {
    const batch = metaKeys.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (key) => {
        try {
          return await kv.get(key.name);
        } catch (err) {
          console.error(`Failed to fetch key ${key.name}:`, err);
          return null;
        }
      })
    );
    results.push(...batchResults);
  }

  const bots: BotMeta[] = [];

  // Apply filters before pagination to ensure consistent page sizes
  for (const data of results) {
    if (data) {
      try {
        const bot: BotMeta = JSON.parse(data);

        // Apply filters
        if (options.publicOnly && !bot.isPublic) continue;
        if (options.ownerId && bot.ownerId !== options.ownerId) continue;

        bots.push(bot);
      } catch (err) {
        // Skip invalid JSON
      }
    }
  }

  // Apply pagination to filtered results
  // This ensures each page returns up to options.limit matching bots
  if (options.limit) {
    const page = options.page || 1;
    const start = (page - 1) * options.limit;
    return bots.slice(start, start + options.limit);
  }

  return bots;
}

// ============================================================================
// Bot Stats Operations
// ============================================================================

/**
 * Get bot statistics
 */
export async function getBotStats(
  kv: KVNamespace,
  clientId: string
): Promise<BotStatsData | null> {
  const key = `bot:${clientId}:stats`;
  const data = await kv.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (err) {
    console.error(
      `Error parsing bot stats for clientId ${clientId} (key: ${key}):`,
      err
    );
    return null;
  }
}

/**
 * Push bot statistics
 */
export async function pushBotStats(
  kv: KVNamespace,
  clientId: string,
  stats: BotStatsPushPayload
): Promise<void> {
  const statsData: BotStatsData = {
    ...stats,
    lastUpdated: new Date().toISOString(),
  };

  // Store in KV with 5 minute expiration (bot should push more frequently)
  // If bot goes offline, stats will naturally expire
  await kv.put(`bot:${clientId}:stats`, JSON.stringify(statsData), {
    expirationTtl: 300, // 5 minutes
  });

  // Also update lastSeen in meta
  await updateBotHeartbeat(kv, clientId);
}

/**
 * Get combined bot info (meta + stats)
 */
export async function getBotInfo(
  kv: KVNamespace,
  clientId: string
): Promise<{ meta: BotMeta; stats: BotStatsData | null } | null> {
  const meta = await getBotMeta(kv, clientId);

  if (!meta) {
    return null;
  }

  const stats = await getBotStats(kv, clientId);

  return { meta, stats };
}

// ============================================================================
// Bot Commands Operations
// ============================================================================

/**
 * Get bot commands
 */
export async function getBotCommands(
  kv: KVNamespace,
  clientId: string
): Promise<BotCommandsData | null> {
  const key = `bot:${clientId}:commands`;
  const data = await kv.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (err) {
    console.error(
      `Error parsing bot commands for clientId ${clientId} (key: ${key}):`,
      err
    );
    return null;
  }
}

/**
 * Update bot commands
 */
export async function updateBotCommands(
  kv: KVNamespace,
  clientId: string,
  commands: BotCommand[]
): Promise<void> {
  const categories = [...new Set(commands.map((c) => c.category))];

  const commandsData: BotCommandsData = {
    commands,
    categories,
    totalCommands: commands.length,
    lastUpdated: new Date().toISOString(),
  };

  await kv.put(`bot:${clientId}:commands`, JSON.stringify(commandsData));
}

// ============================================================================
// Bot Status Helpers
// ============================================================================

/**
 * Check if a bot is online (has recent heartbeat)
 */
export async function isBotOnline(
  kv: KVNamespace,
  clientId: string,
  maxAgeMs: number = 120000 // 2 minutes
): Promise<boolean> {
  const meta = await getBotMeta(kv, clientId);

  if (!meta) {
    return false;
  }

  const lastSeen = new Date(meta.lastSeen);
  const now = new Date();

  // Validate the parsed date - if invalid, treat bot as offline
  if (isNaN(lastSeen.getTime())) {
    console.warn(`Invalid lastSeen date for bot ${clientId}: ${meta.lastSeen}`);
    return false;
  }

  return now.getTime() - lastSeen.getTime() < maxAgeMs;
}

/**
 * Get bot avatar URL
 */
export function getBotAvatarUrl(
  clientId: string,
  avatarHash: string | null
): string {
  if (!avatarHash) {
    // Default Discord avatar
    const discriminator = parseInt(clientId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`;
  }

  const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/app-icons/${clientId}/${avatarHash}.${extension}`;
}
