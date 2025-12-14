import type { FC } from 'hono/jsx';
import { Link } from 'honox/server';
import { Meta } from '@components/Meta';
import { StatusPill } from '@components/ui/StatusPill';
import { SITE } from '@config/site';

interface BaseLayoutProps {
  title?: string;
  description?: string;
  meta?: string;
  structuredData?: object;
  lang?: string;
  children?: any;
  canonical?: string;
}

/**
 * BaseLayout Component
 * ====================
 * Main layout wrapper for all pages
 * Handles:
 * - SEO metadata via Meta component
 * - Dark mode toggle script (HSThemeAppearance)
 * - Global CSS imports
 * - StatusPill floating indicator
 * - Lenis smooth scroll (lazy loaded)
 * - Iconify icon loader
 *
 * Pages compose their own Header and Footer components
 */
export const BaseLayout: FC<BaseLayoutProps> = ({
  title = SITE.title,
  meta,
  structuredData,
  lang = 'en',
  children,
  canonical,
}) => {
  // Dark mode initialization script (must run before body)
  const darkModeScript = `
    if (
      localStorage.getItem('hs_theme') === 'dark' ||
      (!('hs_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  `;

  // Lenis smooth scroll lazy loader (performance optimization)
  const lenisScript = `
    if (typeof window !== 'undefined') {
      import('/assets/scripts/lenisSmoothScroll.js').catch(() => {
        console.warn('[Lenis] Smooth scroll module not found, using CSS fallback');
      });
    }
  `;

  // Theme appearance manager (handles theme toggle clicks)
  const themeAppearanceScript = `
    const HSThemeAppearance = {
      init() {
        const defaultTheme = 'default';
        let theme = localStorage.getItem('hs_theme') || defaultTheme;

        if (document.querySelector('html').classList.contains('dark')) return;
        this.setAppearance(theme);
      },
      _resetStylesOnLoad() {
        const $resetStyles = document.createElement('style');
        $resetStyles.innerText = \`*{transition: unset !important;}\`;
        $resetStyles.setAttribute('data-hs-appearance-onload-styles', '');
        document.head.appendChild($resetStyles);
        return $resetStyles;
      },
      setAppearance(theme, saveInStore = true, dispatchEvent = true) {
        const $resetStylesEl = this._resetStylesOnLoad();

        if (saveInStore) {
          localStorage.setItem('hs_theme', theme);
        }

        if (theme === 'auto') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'default';
        }

        document.querySelector('html').classList.remove('dark');
        document.querySelector('html').classList.remove('default');
        document.querySelector('html').classList.remove('auto');

        document
          .querySelector('html')
          .classList.add(this.getOriginalAppearance());

        setTimeout(() => {
          $resetStylesEl.remove();
        });

        if (dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('on-hs-appearance-change', { detail: theme })
          );
        }
      },
      getAppearance() {
        let theme = this.getOriginalAppearance();
        if (theme === 'auto') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'default';
        }
        return theme;
      },
      getOriginalAppearance() {
        const defaultTheme = 'default';
        return localStorage.getItem('hs_theme') || defaultTheme;
      },
    };
    HSThemeAppearance.init();

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (HSThemeAppearance.getOriginalAppearance() === 'auto') {
          HSThemeAppearance.setAppearance('auto', false);
        }
      });

    window.addEventListener('load', () => {
      const $clickableThemes = document.querySelectorAll(
        '[data-hs-theme-click-value]'
      );
      const $switchableThemes = document.querySelectorAll(
        '[data-hs-theme-switch]'
      );

      $clickableThemes.forEach(($item) => {
        $item.addEventListener('click', () =>
          HSThemeAppearance.setAppearance(
            $item.getAttribute('data-hs-theme-click-value'),
            true,
            $item
          )
        );
      });

      $switchableThemes.forEach(($item) => {
        $item.addEventListener('change', (e) => {
          HSThemeAppearance.setAppearance(e.target.checked ? 'dark' : 'default');
        });

        $item.checked = HSThemeAppearance.getAppearance() === 'dark';
      });

      window.addEventListener('on-hs-appearance-change', (e) => {
        $switchableThemes.forEach(($item) => {
          $item.checked = e.detail === 'dark';
        });
      });
    });

    // Theme toggle click handler for containers
    const themeContainer = document.querySelector('[data-theme-click]');
    if (themeContainer) {
      themeContainer.addEventListener('click', (e) => {
        const themeElement = e.target?.closest('[data-hs-theme-click-value]');
        if (themeElement) {
          const value = themeElement.getAttribute('data-hs-theme-click-value');
          if (value) {
            HSThemeAppearance.setAppearance(value, true, themeElement);
          }
        }
      });
    }
  `;

  return (
    <html lang={lang} class="scrollbar-hide lenis lenis-smooth scroll-pt-16">
      <head>
        <Meta
          meta={meta}
          structuredData={structuredData}
          canonical={canonical}
        />
        <title>{title}</title>

        {/* Iconify for dynamic icons */}
        <script
          src="https://code.iconify.design/3/3.1.0/iconify.min.js"
          async
        />

        {/* Dark mode initialization (blocking) */}
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />

        {/* Global CSS - processed by Vite/PostCSS (Tailwind v4) */}
        <Link href="/app/assets/styles/global.css" rel="stylesheet" />

        <style>
          {`
            /* CSS rules for the page scrollbar */
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }

            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}
        </style>
      </head>
      <body class="bg-sky-50 selection:bg-amina-crimson selection:text-white dark:bg-night-black">
        {/* Lazy load Lenis smooth scroll */}
        <script dangerouslySetInnerHTML={{ __html: lenisScript }} />

        {/* Main content slot */}
        {children}

        {/* Floating Status Pill */}
        <StatusPill />

        {/* Theme appearance manager */}
        <script dangerouslySetInnerHTML={{ __html: themeAppearanceScript }} />
      </body>
    </html>
  );
};
