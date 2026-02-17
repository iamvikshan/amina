/**
 * Doppler Webhook Transformer
 *
 * Transforms Doppler config change webhooks to Discord embeds.
 * Docs: https://docs.doppler.com/docs/webhooks
 */

import { z } from 'zod';

// --- TYPES ---

export const dopplerSchema = z.object({
  config: z.object({
    name: z.string(),
    environment: z.string(),
  }),
  diff: z.object({
    added: z.array(z.string()),
    updated: z.array(z.string()),
    removed: z.array(z.string()),
  }),
  project: z.object({
    name: z.string(),
    id: z.string(),
    workspace: z.string().optional(),
    workplace: z.string().optional(),
  }),
});

type DopplerPayload = z.infer<typeof dopplerSchema>;

// --- CONFIGURATION ---
const DOPPLER_ICON =
  'https://cdn.brandfetch.io/idnue19GGN/w/400/h/400/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B';
const MAX_ITEMS_TO_SHOW = 15; // Prevent Discord Embed limits from breaking the workflow

/**
 * Transform Doppler payload to Discord embed format
 */
export function transformDopplerPayload(
  payload: DopplerPayload
): DiscordWebhookPayload {
  const config = payload.config;
  const diff = payload.diff;
  const project = payload.project;

  // Arrays of changes
  const added = diff.added || [];
  const updated = diff.updated || [];
  const removed = diff.removed || [];
  const totalChanges = added.length + updated.length + removed.length;

  // --- STYLING LOGIC ---

  // Determine Color
  let embedColor = 0x5865f2; // Discord Blurple (Default)
  if (removed.length > 0 && added.length === 0 && updated.length === 0) {
    embedColor = 0xed4245; // Red (Only removals)
  } else if (added.length > 0 && removed.length === 0 && updated.length === 0) {
    embedColor = 0x57f287; // Green (Only additions)
  } else if (totalChanges > 0) {
    embedColor = 0xfee75c; // Yellow (Mixed/Updates)
  }

  // Determine Title
  let titleAction = 'Configuration Updated';

  if (added.length > 0 && removed.length > 0) {
    titleAction = 'Secrets Sync';
  } else if (added.length > 0) {
    titleAction = 'Secrets Added';
  } else if (removed.length > 0) {
    titleAction = 'Secrets Removed';
  } else if (updated.length > 0) {
    titleAction = 'Secrets Modified';
  }

  // Helper to format list with limits
  const formatList = (items: string[], prefix = ''): string => {
    if (!items || items.length === 0) return '';
    const displayItems = items.slice(0, MAX_ITEMS_TO_SHOW);
    const remainder = items.length - MAX_ITEMS_TO_SHOW;

    let text = displayItems.map((i) => `${prefix}${i}`).join('\n');
    if (remainder > 0) text += `\n... and ${remainder} more`;
    return text;
  };

  // --- BUILD FIELDS ---
  const fields: DiscordEmbed['fields'] = [];

  // 1. Added Fields (Green Diff Syntax)
  if (added.length > 0) {
    fields.push({
      name: `✅ Added (${added.length})`,
      value: `\`\`\`diff\n${formatList(added, '+ ')}\n\`\`\``,
      inline: false,
    });
  }

  // 2. Updated Fields (Yaml Syntax for readability)
  if (updated.length > 0) {
    fields.push({
      name: `🔄 Updated (${updated.length})`,
      value: `\`\`\`yaml\n${formatList(updated)}\n\`\`\``,
      inline: false,
    });
  }

  // 3. Removed Fields (Red Diff Syntax)
  if (removed.length > 0) {
    fields.push({
      name: `❌ Removed (${removed.length})`,
      value: `\`\`\`diff\n${formatList(removed, '- ')}\n\`\`\``,
      inline: false,
    });
  }

  // 4. Empty State
  if (totalChanges === 0) {
    fields.push({
      name: 'Status',
      value: 'No secret values were changed in this update.',
      inline: false,
    });
  }

  // --- CONSTRUCT EMBED ---
  const workspace = project.workspace || project.workplace;
  const ts = new Date();

  const embed: DiscordEmbed = {
    // "Author" slot used for Project Name to visually group it at the top
    author: {
      name: project.name || 'Doppler Project',
      icon_url: DOPPLER_ICON,
      url:
        project.id && workspace
          ? `https://dashboard.doppler.com/workplace/${encodeURIComponent(
              workspace
            )}/projects/${encodeURIComponent(project.id)}/configs/${encodeURIComponent(
              config.name
            )}`
          : undefined,
    },
    title: titleAction,
    // Description holds the Environment context clearly
    description: `**Environment:** \`${config.environment}\`\n**Config:** \`${config.name}\``,
    color: embedColor,
    fields: fields,
    footer: {
      text: `Doppler • ${ts.toISOString().slice(11, 19)} UTC`,
      icon_url: DOPPLER_ICON,
    },
    timestamp: ts.toISOString(),
  };

  // --- RETURN DISCORD WEBHOOK PAYLOAD ---
  return {
    username: 'Doppler',
    avatar_url: DOPPLER_ICON,
    embeds: [embed],
  };
}
