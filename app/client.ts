// Client-side hydration bootstrap for HonoX
// This file will be used for interactive islands hydration

import { createClient } from 'honox/client';

// Import global CSS - this gets processed by Vite/PostCSS (Tailwind v4)
import '@styles/global.css';

createClient();
