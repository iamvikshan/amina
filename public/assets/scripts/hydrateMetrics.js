/**
 * Hydrate Metrics - Client-side stat updater
 * ==========================================
 * Fetches /api/metrics and updates all [data-stat] elements with live values.
 * Animates counters and formats display text.
 */

const API_ENDPOINT = '/api/metrics';
const CACHE_KEY = '__aminaMetrics';

// Skip if already fetched this session
if (window[CACHE_KEY]) {
  applyMetrics(window[CACHE_KEY]);
} else {
  // Fetch metrics and update all data-stat elements
  fetch(API_ENDPOINT, { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      return res.json();
    })
    .then((data) => {
      window[CACHE_KEY] = data; // Cache for navigation
      applyMetrics(data);
    })
    .catch((err) => {
      console.error('[hydrateMetrics] Failed to fetch metrics', err);
    });
}

function applyMetrics(metrics) {
  const { guilds, members, uptime } = metrics;

  // Format helpers
  const formatGuilds = (n) =>
    n >= 1000 ? `${Math.floor(n / 1000)}k+` : `${n}+`;
  const formatUptime = (n) => n.toFixed(1) + '%';

  // Update all data-stat elements
  document.querySelectorAll('[data-stat]').forEach((el) => {
    const stat = el.getAttribute('data-stat');

    switch (stat) {
      case 'guilds':
        animateCounter(el, guilds);
        break;
      case 'members':
        animateCounter(el, members);
        break;
      case 'uptime':
        animateCounter(el, uptime, true);
        break;
      case 'guilds-formatted':
        el.textContent = formatGuilds(guilds);
        break;
      case 'uptime-formatted':
        el.textContent = formatUptime(uptime);
        break;
    }
  });
}

function animateCounter(el, target, isDecimal = false) {
  let current = 0;
  const duration = 2000; // 2 seconds
  const increment = target / (duration / 16); // 60fps

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    const formatted = isDecimal
      ? current.toFixed(1)
      : Math.floor(current).toLocaleString();

    el.textContent = formatted;
  }, 16);
}
