// app/routes/dash/_middleware.ts
/**
 * Protected route middleware for /dash/*
 * All routes under /dash require authentication
 */
import { authGuard, attachUser } from '../../middleware';
import { createMiddleware } from 'hono/factory';

export default createMiddleware(async (c, next) => {
  // Apply auth guard first
  await authGuard(c, async () => {
    // Then attach user data to context
    await attachUser(c, next);
  });
});
