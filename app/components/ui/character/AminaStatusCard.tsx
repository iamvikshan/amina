import type { FC } from 'hono/jsx';
import { ImagePaths } from '@/utils/cdn';

export const AminaStatusCard: FC = () => {
  const script = `
    const METRICS_API = '/api/metrics';

    const statusPortraitMap = {
      online: '${ImagePaths.portraits.idle}',
      idle: '${ImagePaths.portraits.success}',
      dnd: '${ImagePaths.portraits.alert}',
      invisible: '${ImagePaths.portraits.error}',
    };

    const statusConfig = {
      online: { label: 'On Patrol', dotColor: 'bg-discord-green', kaomoji: '[>]' },
      idle: { label: 'Idle', dotColor: 'bg-yellow-500', kaomoji: '[~]' },
      dnd: { label: 'In Battle', dotColor: 'bg-red-500', kaomoji: '[!]' },
      invisible: { label: 'Offline', dotColor: 'bg-gray-500', kaomoji: '[x]' },
    };

    async function fetchMetrics() {
      try {
        const res = await fetch(METRICS_API, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    function setStatus(data) {
      const root = document.querySelector('.amina-status-card');
      if (!root) return;

      const status = (data && data.status) || 'online';
      const cfg = statusConfig[status] || statusConfig.online;

      const portrait = document.getElementById('amina-portrait');
      if (portrait) portrait.src = statusPortraitMap[status] || statusPortraitMap.online;

      const statusText = document.getElementById('status-text');
      if (statusText) statusText.textContent = cfg.label;

      const kaomoji = root.querySelector('.status-kaomoji');
      if (kaomoji) kaomoji.textContent = cfg.kaomoji;

      const dot = document.getElementById('status-dot-inner');
      if (dot) {
        dot.className = 'w-2.5 h-2.5 rounded-full animate-pulse ' + cfg.dotColor;
      }

      const msg = document.getElementById('amina-message');
      const presenceMsg = data && data.presence && data.presence.message;
      if (msg) msg.textContent = presenceMsg || '"Night Guard Protocol active."';

      root.setAttribute('data-status', status);
    }

    async function init() {
      const data = await fetchMetrics();
      if (data) setStatus(data);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  `;

  return (
    <>
      <div
        class="amina-status-card group relative bg-gradient-to-br from-night-steel/70 to-night-shadow/70 backdrop-blur-md border-2 border-cyber-blue/30 rounded-xl p-4 transition-all duration-500 hover:border-cyber-blue/60 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,206,209,0.3)]"
        data-status="loading"
      >
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div class="flex items-center gap-4">
          <div class="relative flex-shrink-0">
            <div
              class="relative w-16 h-16 rounded-full border-2 transition-all duration-500 portrait-container"
              style="border-color: #00CED1; box-shadow: 0 0 12px rgba(0, 206, 209, 0.4);"
            >
              <img
                id="amina-portrait"
                src={ImagePaths.portraits.idle}
                alt="Amina Portrait"
                class="w-full h-full rounded-full object-cover pixelated"
                loading="lazy"
              />
            </div>

            <div class="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-night-shadow flex items-center justify-center status-dot">
              <div
                class="w-2.5 h-2.5 rounded-full animate-pulse"
                id="status-dot-inner"
              />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="mb-2">
              <p class="text-xs font-mono uppercase tracking-wider text-cyber-blue flex items-center gap-2 status-label">
                <span class="status-kaomoji">{'[>]'}</span>
                <span id="status-text">On Patrol</span>
              </p>
            </div>

            <div>
              <p
                id="amina-message"
                class="text-xs text-neutral-400 italic leading-snug font-dialogue line-clamp-2"
              >
                "Checking status..."
              </p>
            </div>
          </div>
        </div>

        <div class="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-amina-crimson/30 group-hover:border-amina-crimson/60 transition-colors duration-300" />
      </div>

      <style>
        {`
          .pixelated {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }

          @keyframes portrait-breathe {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          .portrait-container {
            animation: portrait-breathe 4s ease-in-out infinite;
          }

          .font-dialogue {
            font-family: 'Quicksand', 'Comfortaa', cursive, system-ui;
          }
        `}
      </style>

      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
