// Authentication Middleware Types

export type RouteConfig = {
  path: string;
  requiresAuth: boolean;
  forceDynamic?: boolean;
};
