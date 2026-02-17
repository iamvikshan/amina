/**
 * Webhook Transformer UI Templates
 *
 * Minimal static webpage for transforming Discord webhooks to provider format.
 * Similar to https://commit451.com/skyhook-web/
 */

import { aminaDesignSystem } from '../styles';

const styles = `
${aminaDesignSystem}

body {
  padding: var(--space-4);
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding-top: var(--space-8);
}

.header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.logo {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--amina-crimson);
  text-shadow: var(--glow-crimson);
  margin-bottom: var(--space-2);
}

.subtitle {
  color: var(--off-white);
  font-size: 1.1rem;
  opacity: 0.9;
}

.card {
  background: var(--shadow-gray);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-md);
}

.form-group {
  margin-bottom: var(--space-6);
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--electric-blue);
}

input, select {
  width: 100%;
  padding: var(--space-4);
  background: var(--midnight-black);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  color: var(--pure-white);
  font-family: var(--font-mono);
  font-size: 0.95rem;
  transition: all 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--electric-blue);
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
}

.result-section {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--steel-gray);
}

.result-label {
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--discord-green);
}

.result-url {
  background: var(--midnight-black);
  border: 1px solid var(--discord-green);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--discord-green);
  word-break: break-all;
  position: relative;
}

.copy-btn {
  margin-top: var(--space-4);
  width: 100%;
  padding: var(--space-4);
  background: var(--electric-blue);
  border: none;
  border-radius: var(--radius-md);
  color: var(--pure-white);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #1873cc;
  transform: translateY(-1px);
}

.copy-btn:active {
  transform: translateY(0);
}

.copy-btn.copied {
  background: var(--discord-green);
}

.info {
  background: var(--slate-gray);
  border-left: 3px solid var(--electric-blue);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  font-size: 0.9rem;
  color: var(--off-white);
}

.provider-list {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.provider-item {
  background: var(--midnight-black);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.provider-name {
  font-weight: 600;
  color: var(--electric-blue);
  margin-bottom: var(--space-2);
}

.provider-desc {
  font-size: 0.9rem;
  color: var(--off-white);
  opacity: 0.8;
}

.footer {
  text-align: center;
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--steel-gray);
  color: var(--off-white);
  opacity: 0.7;
  font-size: 0.9rem;
}

.footer a {
  color: var(--electric-blue);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .logo {
    font-size: 2rem;
  }
  .card {
    padding: var(--space-6);
  }
}
`;

export function webhookTransformerPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webhook Transformer - Amina API</title>
  <meta name="description" content="Transform Discord webhooks to various provider formats">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Rajdhani:wght@700&display=swap" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">⚡ Webhook Transformer</h1>
      <p class="subtitle">Transform Discord webhooks to various provider formats</p>
    </div>

    <div class="card">
      <div class="info">
        <strong>How it works:</strong> Paste your Discord webhook URL below, select a provider, 
        and get a transformed URL to use in your service (Doppler, DockerHub, etc.)
      </div>

      <form id="transformForm">
        <div class="form-group">
          <label for="webhookUrl">Discord Webhook URL</label>
          <input 
            type="url" 
            id="webhookUrl" 
            placeholder="https://discord.com/api/webhooks/1234567890/abcdefg..."
            required
          >
        </div>

        <div class="form-group">
          <label for="provider">Provider</label>
          <select id="provider" required>
            <option value="">Select a provider...</option>
            <option value="doppler">Doppler (Config Changes)</option>
          </select>
        </div>

        <div class="result-section" id="resultSection" style="display: none;">
          <div class="result-label">✓ Your Transformed Webhook URL:</div>
          <div class="result-url" id="resultUrl"></div>
          <button type="button" class="copy-btn" id="copyBtn">
            📋 Copy to Clipboard
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2 style="color: var(--electric-blue); margin-bottom: var(--space-4);">Supported Providers</h2>
      <div class="provider-list">
        <div class="provider-item">
          <div class="provider-name">🔐 Doppler</div>
          <div class="provider-desc">
            Receive formatted embeds when secrets are added, updated, or removed in your Doppler configs.
            <a href="https://docs.doppler.com/docs/webhooks" target="_blank" style="color: var(--electric-blue);">Learn more →</a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        Powered by <a href="https://api.4mina.app">Amina API</a> • 
        <a href="https://4mina.app/dash">Dashboard</a> • 
        <a href="https://api.apidocs.4mina.app">Documentation</a>
      </p>
    </div>
  </div>

  <script>
    const form = document.getElementById('transformForm');
    const webhookInput = document.getElementById('webhookUrl');
    const providerSelect = document.getElementById('provider');
    const resultSection = document.getElementById('resultSection');
    const resultUrl = document.getElementById('resultUrl');
    const copyBtn = document.getElementById('copyBtn');

    // Track reset timeout to prevent overlapping timers
    let resetTimeout = null;

    // Helper to schedule button reset and avoid duplicate timers
    function scheduleReset() {
      // Clear any existing timeout
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
      // Schedule new reset
      resetTimeout = setTimeout(() => {
        copyBtn.textContent = '📋 Copy to Clipboard';
        copyBtn.classList.remove('copied');
        resetTimeout = null; // Clear reference once executed
      }, 2000);
    }

    function transformWebhook() {
      const webhookUrl = webhookInput.value.trim();
      const provider = providerSelect.value;

      if (!webhookUrl || !provider) {
        resultSection.style.display = 'none';
        return;
      }

      // Extract ID and token from Discord webhook URL
      const match = webhookUrl.match(/webhooks\\/(\\d+)\\/([^/?]+)/);
      if (!match) {
        resultSection.style.display = 'none';
        return;
      }

      const [, id, token] = match;
      const transformedUrl = \`https://api.4mina.app/webhooks/\${id}/\${token}/\${provider}\`;

      resultUrl.textContent = transformedUrl;
      resultSection.style.display = 'block';
    }

    webhookInput.addEventListener('input', transformWebhook);
    providerSelect.addEventListener('change', transformWebhook);
    form.addEventListener('submit', (e) => e.preventDefault());

    copyBtn.addEventListener('click', async () => {
      // Clear any existing timeout immediately to prevent overlapping
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        resetTimeout = null;
      }

      const url = resultUrl.textContent;
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');
        scheduleReset();
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            copyBtn.textContent = '✓ Copied!';
            copyBtn.classList.add('copied');
            scheduleReset();
          } else {
            copyBtn.textContent = 'Copy failed';
            copyBtn.classList.remove('copied');
            scheduleReset();
          }
        } catch (e) {
          copyBtn.textContent = 'Copy failed';
          copyBtn.classList.remove('copied');
          scheduleReset();
        } finally {
          document.body.removeChild(textArea);
        }
      }
    });
  </script>
</body>
</html>`;
}
