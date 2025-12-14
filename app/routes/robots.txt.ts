const robotsTxt = `
User-agent: Googlebot
Disallow:
Allow: /
Crawl-delay: 10

User-agent: Yandex
Disallow:
Allow: /
Crawl-delay: 2

User-agent: archive.org_bot
Disallow:
Allow: /
Crawl-delay: 2

User-agent: *
Disallow: /

Sitemap: https://4mina.app/sitemap-index.xml
`.trim();

import { createRoute } from 'honox/factory';

export const GET = createRoute(
  () =>
    new Response(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
);
