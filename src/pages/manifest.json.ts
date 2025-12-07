import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import icon from '@images/amina/logo/headshot-emoji.png';
import type { Favicon } from '@types';

export const prerender = true;

const sizes = [192, 512];
const favicons: Favicon[] = [
  {
    purpose: 'any',
    src: icon,
    sizes,
  },
  {
    purpose: 'maskable',
    src: icon,
    sizes,
  },
];

export const GET: APIRoute = async () => {
  const icons = await Promise.all(
    favicons.flatMap((favicon) =>
      favicon.sizes.map(async (size) => {
        const image = await getImage({
          src: favicon.src,
          width: size,
          height: size,
          format: 'png',
        });
        return {
          src: image.src,
          sizes: `${image.options.width}x${image.options.height}`,
          type: `image/${image.options.format}`,
          purpose: favicon.purpose,
        };
      })
    )
  );

  const manifest = {
    short_name: 'Amina',
    name: 'Amina',
    icons,
    display: 'minimal-ui',
    id: '/',
    start_url: '/',
    theme_color: '#FFEDD5',
    background_color: '#262626',
  };

  return new Response(JSON.stringify(manifest));
};
