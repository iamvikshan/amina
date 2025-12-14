import { createRoute } from 'honox/factory';

export const GET = createRoute(() => {
  // HonoX equivalent of Astro manifest generator.
  // During migration we emit a stable manifest that references the favicon.
  const manifest = {
    short_name: 'Amina',
    name: 'Amina',
    icons: [
      {
        purpose: 'any',
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    display: 'minimal-ui',
    id: '/',
    start_url: '/',
    theme_color: '#FFEDD5',
    background_color: '#262626',
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
});
