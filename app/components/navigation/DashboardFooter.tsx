import type { FC } from 'hono/jsx';
import { SITE, URLS } from '@/config/site';
import navigation from '@/utils/navigation';
import { LucideIcon } from '@/components/ui/icons/LucideIcon';
import { FooterSocialLink } from '@/components/ui/links/FooterSocialLink';

export const DashboardFooter: FC = () => {
  const crafted = 'Forged by';
  const year = new Date().getFullYear();

  const dashboardLinks = [
    { name: 'Documentation', url: URLS.docs, external: true },
    { name: 'Home', url: '/', external: false },
    { name: 'Support Server', url: URLS.support, external: true },
    { name: 'GitHub', url: URLS.github, external: true },
  ];

  return (
    <footer class="relative w-full overflow-hidden bg-night-black border-t border-night-steel/30 mt-auto">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-20 -left-20 w-64 h-64 bg-amina-crimson/15 rounded-full blur-[100px]" />
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-cyber-blue/15 rounded-full blur-[100px]" />
      </div>

      <div class="relative mx-auto w-full max-w-[85rem] px-4 py-6 sm:px-6 lg:px-16 2xl:max-w-screen-2xl">
        <div class="space-y-4">
          <div class="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div class="flex flex-col items-center lg:items-start gap-1 text-center lg:text-left">
              <p class="text-xs text-neutral-400 dark:text-neutral-500">
                © {year} {SITE.title}. All rights reserved.
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-600">
                {crafted}{' '}
                <a
                  class="text-amina-crimson font-medium underline underline-offset-2 outline-none transition-all duration-300 hover:text-rose-red hover:decoration-dashed focus:outline-none focus-visible:text-rose-red"
                  href="https://vikshan.me"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vikshan
                </a>{' '}
                with{' '}
                <span class="inline-flex items-center gap-1 align-middle">
                  <LucideIcon
                    name="music"
                    class="inline text-amina-crimson"
                    size={16}
                  />
                  <span>and</span>
                  <LucideIcon
                    name="coffee"
                    class="inline text-cyber-blue"
                    size={16}
                  />
                </span>
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {dashboardLinks.map((link) => (
                <a
                  href={link.url}
                  target={link.external ? '_blank' : '_self'}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  class="group inline-flex items-center gap-x-1.5 text-sm text-neutral-400 outline-none transition-all duration-300 hover:text-amina-crimson focus-visible:text-amina-crimson dark:text-neutral-500 dark:hover:text-amina-crimson"
                >
                  <span class="w-1 h-1 bg-night-steel rounded-full group-hover:bg-amina-crimson transition-colors duration-300" />
                  {link.name}
                </a>
              ))}
            </div>

            <div class="flex items-center gap-3">
              <FooterSocialLink url={URLS.support}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  class="w-5 h-5"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                  <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
                  <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3" />
                  <path d="M7 16.5c3.5 1 6.5 1 10 0" />
                </svg>
              </FooterSocialLink>
              <FooterSocialLink url={navigation.socialLinks.x}>
                <LucideIcon name="twitter" class="w-5 h-5" />
              </FooterSocialLink>
              <FooterSocialLink url={navigation.socialLinks.github}>
                <LucideIcon name="github" class="w-5 h-5" />
              </FooterSocialLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
