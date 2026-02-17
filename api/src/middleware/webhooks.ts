import type { Context, Next } from 'hono';
import { error } from '../lib/response';

export const ALLOWED_PROVIDERS = ['doppler'];

export const validateWebhookParams = async (
  c: Context<{ Bindings: Env }>,
  next: Next
) => {
  const { id, token, provider } = c.req.param();

  // Validate Discord Webhook ID (digits only)
  if (!id || !/^\d+$/.test(id)) {
    return error(c, 'Invalid Discord webhook ID format', { status: 400 });
  }

  // Validate Discord Webhook Token (alphanumeric, dashes, underscores, min length 60)
  if (!token || token.length < 60 || !/^[A-Za-z0-9-_]+$/.test(token)) {
    return error(c, 'Invalid Discord webhook token format', { status: 400 });
  }

  // Validate Provider
  if (!provider || !ALLOWED_PROVIDERS.includes(provider.toLowerCase())) {
    return error(c, `Unsupported provider: ${provider}`, {
      status: 400,
      details: { supportedProviders: ALLOWED_PROVIDERS },
    });
  }

  await next();
};
