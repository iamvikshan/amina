// app/routes/dash/_middleware.ts
/**
 * Protected route middleware for /dash/*
 * All routes under /dash require authentication
 */
import { authGuard, attachUser } from '@/middleware';
import { createMiddleware } from 'hono/factory';

export default [
  authGuard,
  createMiddleware(async (c, next) => {
    await attachUser(c, next);
  }),
];
