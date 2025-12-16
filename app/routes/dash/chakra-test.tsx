/**
 * Dashboard Test Page - Chakra UI Components
 * Route: /dash/chakra-test
 * Tests the new Chakra UI theme and components
 */

import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  // This page tests the Chakra UI integration
  // For now, render a simple HTML page that loads Chakra client-side

  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chakra UI Test - Amina Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Nunito Sans', sans-serif;
      background: #0a0a0a;
      color: white;
      min-height: 100vh;
    }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root">
    <div style="padding: 2rem; text-align: center;">
      <h1 style="font-family: 'Exo 2', sans-serif; font-size: 2rem; margin-bottom: 1rem; color: #dc143c;">
        Chakra UI Integration Test
      </h1>
      <p style="color: #999; margin-bottom: 2rem;">
        This page demonstrates the Amina color theme with Chakra UI components.
      </p>
      
      <!-- Color Palette Preview -->
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-family: 'Exo 2', sans-serif; margin-bottom: 1rem;">Amina Color Palette</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <!-- Brand Colors -->
          <div style="background: #dc143c; padding: 1rem; border-radius: 0.5rem;">
            <div style="font-weight: 600;">Crimson</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#dc143c</div>
          </div>
          <div style="background: #b01030; padding: 1rem; border-radius: 0.5rem;">
            <div style="font-weight: 600;">Dark</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#b01030</div>
          </div>
          <div style="background: #e8364b; padding: 1rem; border-radius: 0.5rem;">
            <div style="font-weight: 600;">Light</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#e8364b</div>
          </div>
          
          <!-- Night Colors -->
          <div style="background: #1a1a1a; padding: 1rem; border-radius: 0.5rem; border: 1px solid #333;">
            <div style="font-weight: 600;">Night 800</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#1a1a1a</div>
          </div>
          <div style="background: #0a0a0a; padding: 1rem; border-radius: 0.5rem; border: 1px solid #333;">
            <div style="font-weight: 600;">Night 900</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#0a0a0a</div>
          </div>
          
          <!-- Accent Colors -->
          <div style="background: #ffd700; padding: 1rem; border-radius: 0.5rem; color: black;">
            <div style="font-weight: 600;">Imperial Gold</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#ffd700</div>
          </div>
          <div style="background: #00d4ff; padding: 1rem; border-radius: 0.5rem; color: black;">
            <div style="font-weight: 600;">Cyber Blue</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">#00d4ff</div>
          </div>
        </div>
        
        <!-- Button Styles Preview -->
        <h2 style="font-family: 'Exo 2', sans-serif; margin-bottom: 1rem;">Button Styles</h2>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">
          <button style="background: linear-gradient(135deg, #dc143c, #b01030); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            Primary Button
          </button>
          <button style="background: transparent; color: #dc143c; padding: 0.75rem 1.5rem; border: 2px solid #dc143c; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            Outline Button
          </button>
          <button style="background: rgba(220, 20, 60, 0.1); color: #dc143c; padding: 0.75rem 1.5rem; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            Ghost Button
          </button>
        </div>
        
        <!-- Card Preview -->
        <h2 style="font-family: 'Exo 2', sans-serif; margin-bottom: 1rem;">Card Component</h2>
        <div style="background: #1a1a1a; border: 1px solid #2d2d2d; border-radius: 1rem; padding: 1.5rem; max-width: 400px; margin: 0 auto 2rem;">
          <h3 style="font-family: 'Exo 2', sans-serif; font-size: 1.25rem; margin-bottom: 0.5rem;">Feature Card</h3>
          <p style="color: #999; font-size: 0.875rem; margin-bottom: 1rem;">
            This is how cards will look with the Amina theme. Dark backgrounds with subtle borders.
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="color: #dc143c; font-weight: 600;">Enabled</span>
            <div style="width: 48px; height: 24px; background: #dc143c; border-radius: 12px; position: relative;">
              <div style="position: absolute; right: 2px; top: 2px; width: 20px; height: 20px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        </div>
        
        <p style="color: #666; font-size: 0.875rem;">
          Components are ready in <code style="background: #1a1a1a; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">/app/components/dashboard/chakra/</code>
        </p>
        
        <div style="margin-top: 2rem;">
          <a href="/dash" style="color: #dc143c; text-decoration: none; font-weight: 600;">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `);
});
