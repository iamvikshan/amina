/**
 * Dashboard Home - Chakra UI Version
 * Route: /dash/new
 * This is the new Chakra-powered dashboard
 */

import { createRoute } from 'honox/factory';
import { Link } from 'honox/server';

export default createRoute(async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Servers - Amina Dashboard</title>
  <meta name="description" content="Manage your Discord servers with Amina">
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: dark;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito Sans', system-ui, sans-serif;
      background: #0a0a0a;
      color: white;
      min-height: 100vh;
    }
    #dashboard-root { min-height: 100vh; }
    
    /* Loading state */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }
    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #333;
      border-top-color: #dc143c;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      color: #999;
      font-size: 0.875rem;
    }
    
    /* Chakra color mode support */
    .chakra-ui-dark {
      color-scheme: dark;
    }
  </style>
</head>
<body class="chakra-ui-dark">
  <div id="dashboard-root" data-component="dashboard-home">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading dashboard...</div>
    </div>
  </div>
  <script type="module" src="/app/dashboard-client.tsx"></script>
</body>
</html>
  `);
});

