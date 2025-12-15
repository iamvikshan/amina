/**
 * Dashboard Route Middleware
 * Protect all /dash/* routes with authentication
 */

import { createRoute } from 'honox/factory';
import { authGuard, attachSession } from '@/middleware';

export default createRoute(authGuard, attachSession);
