import type { FC } from 'hono/jsx';
import { FooterSocialLink } from '@/components/ui/links/FooterSocialLink';
import { BrandLogo } from '@/components/BrandLogo';
import { AminaStatusCard } from '@/components/ui/character/AminaStatusCard';
import { SITE, URLS } from '@/config/site';
import enStrings from '@/utils/navigation';
import { LucideIcon } from '@/components/ui/icons/LucideIcon';

interface Link {
  name: string;
  url: string;
  target?: '_blank' | '_self';
  rel?: string;
}

interface FooterSectionType {
  section: string;
  links: Link[];
}

const strings = enStrings as {
  footerLinks: FooterSectionType[];
  socialLinks: Record<string, string>;
};

const crafted = 'Forged by';

const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http') || url.startsWith('https');
};

const getLinkAttributes = (link: Link) => {
  const isExternal = isExternalUrl(link.url);
  return {
    target: link.target || (isExternal ? '_blank' : '_self'),
    rel: link.rel || (isExternal ? 'noopener noreferrer' : undefined),
  };
};

export const FooterSection: FC = () => {
  const script = `
    function handleDiscordAuth(button) {
      const width = 500;
      const height = 800;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        button.href,
        'discordAuthPopup',
        'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',scrollbars=yes'
      );

      if (popup) popup.focus();

      const checkPopup = setInterval(() => {
        try {
          if (popup && popup.closed) {
            clearInterval(checkPopup);
            window.dispatchEvent(new CustomEvent('discordInviteComplete'));
          }
        } catch {
          // ignore cross-origin errors
        }
      }, 500);
    }

    document
      .querySelectorAll('a[href*="discord.com/oauth2/authorize"]')
      .forEach((button) => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          handleDiscordAuth(button);
        });
      });

    const year = new Date().getFullYear();
    const element = document.getElementById('current-year');
    if (element) element.innerText = year.toString();

    window.addEventListener('discordInviteComplete', () => {
      console.log('Discord invite popup closed');
    });
  `;

  return (
    <>
      <footer class="relative w-full overflow-hidden bg-night-black border-t border-night-steel/30">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-40 -left-40 w-80 h-80 bg-amina-crimson/10 rounded-full blur-3xl" />
          <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-cyber-blue/10 rounded-full blur-3xl" />
        </div>

        <div class="relative mx-auto w-full max-w-[85rem] px-4 py-10 sm:px-6 lg:px-16 lg:pt-20 2xl:max-w-screen-2xl">
          <div class="lg:hidden space-y-8">
            <div class="flex flex-col items-center text-center">
              <BrandLogo class="h-auto w-32 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(220,20,60,0.6)]" />
              <p class="mt-4 text-sm text-neutral-400 dark:text-neutral-500 max-w-md leading-relaxed">
                <span class="text-amina-crimson font-semibold">
                  Your Guardian Companion.
                </span>
                <br />
                Protecting communities, bringing people together, one server at
                a time.
              </p>
              <div class="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-night-steel/40 border border-amina-crimson/30 rounded-lg backdrop-blur-sm">
                <div class="w-2 h-2 bg-discord-green rounded-full animate-pulse" />
                <span class="text-xs font-semibold text-cyber-blue uppercase tracking-wider">
                  Active & Protecting
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              {strings.footerLinks.map((section) => (
                <div>
                  <h3 class="font-bold text-neutral-200 dark:text-neutral-100 uppercase tracking-wider text-sm mb-4 border-l-2 border-amina-crimson pl-3">
                    {section.section}
                  </h3>
                  <ul class="mt-3 grid space-y-3">
                    {section.links.map((link) => {
                      const attrs = getLinkAttributes(link);
                      return (
                        <li>
                          <a
                            href={link.url}
                            {...attrs}
                            class="group inline-flex items-center gap-x-2 text-sm rounded-lg text-neutral-400 outline-none transition-all duration-300 hover:text-amina-crimson hover:translate-x-1 focus-visible:text-amina-crimson dark:text-neutral-500 dark:hover:text-amina-crimson"
                          >
                            <span class="w-1 h-1 bg-night-steel rounded-full group-hover:bg-amina-crimson transition-colors duration-300" />
                            {link.name}
                          </a>
                          {section.section === 'Arsenal' &&
                          link.name === 'Command Center' ? (
                            <span class="ms-2 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amina-crimson to-rose-red px-2 py-1 text-xs font-bold text-white shadow-[0_0_15px_rgba(220,20,60,0.4)]">
                              <svg
                                class="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              New!
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <AminaStatusCard />
          </div>

          <div class="hidden lg:flex lg:items-start lg:justify-between lg:gap-8">
            <div class="flex-shrink-0 max-w-sm">
              <div class="flex items-start gap-4">
                <BrandLogo class="h-auto w-28 flex-shrink-0 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(220,20,60,0.6)]" />
                <div class="flex flex-col gap-3">
                  <p class="text-sm text-neutral-400 dark:text-neutral-500 leading-relaxed">
                    <span class="text-amina-crimson font-semibold block mb-1">
                      Your Guardian Companion.
                    </span>
                    Protecting communities, bringing people together, one server
                    at a time.
                  </p>
                  <div class="inline-flex items-center gap-2 px-3 py-2 bg-night-steel/40 border border-amina-crimson/30 rounded-lg backdrop-blur-sm w-fit">
                    <div class="w-2 h-2 bg-discord-green rounded-full animate-pulse" />
                    <span class="text-xs font-semibold text-cyber-blue uppercase tracking-wider">
                      Active & Protecting
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-grow flex items-start justify-center gap-12">
              {strings.footerLinks.map((section) => (
                <div class="flex-shrink-0">
                  <h3 class="font-bold text-neutral-200 dark:text-neutral-100 uppercase tracking-wider text-sm mb-4 border-l-2 border-amina-crimson pl-3">
                    {section.section}
                  </h3>
                  <ul class="space-y-3">
                    {section.links.map((link) => {
                      const attrs = getLinkAttributes(link);
                      return (
                        <li>
                          <a
                            href={link.url}
                            {...attrs}
                            class="group inline-flex items-center gap-x-2 text-sm rounded-lg text-neutral-400 outline-none transition-all duration-300 hover:text-amina-crimson hover:translate-x-1 focus-visible:text-amina-crimson dark:text-neutral-500 dark:hover:text-amina-crimson"
                          >
                            <span class="w-1 h-1 bg-night-steel rounded-full group-hover:bg-amina-crimson transition-colors duration-300" />
                            {link.name}
                          </a>
                          {section.section === 'Arsenal' &&
                          link.name === 'Command Center' ? (
                            <span class="ms-2 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amina-crimson to-rose-red px-2 py-1 text-xs font-bold text-white shadow-[0_0_15px_rgba(220,20,60,0.4)]">
                              <svg
                                class="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              New!
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div class="flex-shrink-0 w-[272px]">
              <AminaStatusCard />
            </div>
          </div>

          <div class="mt-9 pt-9 border-t border-night-steel/30 grid gap-y-4 sm:mt-12 sm:pt-12">
            <div class="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div class="flex flex-col items-center lg:items-start gap-2 text-center lg:text-left">
                <p class="text-sm text-neutral-400 dark:text-neutral-500">
                  © <span id="current-year"></span>
                  {SITE.title}. All rights reserved.
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-600">
                  {crafted}
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

              <div class="hidden lg:block">
                <p class="text-xs text-neutral-500 dark:text-neutral-600 font-mono uppercase tracking-widest">
                  <span class="text-amina-crimson">▸</span> Night Guard Protocol
                  Active <span class="text-cyber-blue">▸</span> Server
                  Protection Enabled
                </p>
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
                <FooterSocialLink url={strings.socialLinks.x}>
                  <LucideIcon name="twitter" class="w-5 h-5" />
                </FooterSocialLink>
                <FooterSocialLink url={strings.socialLinks.github}>
                  <LucideIcon name="github" class="w-5 h-5" />
                </FooterSocialLink>
              </div>
            </div>

            <div class="lg:hidden pt-2 text-center border-t border-night-steel/20">
              <p class="text-xs text-neutral-500 dark:text-neutral-600 font-mono uppercase tracking-widest">
                <span class="text-amina-crimson">▸</span> Night Guard Protocol
                Active <span class="text-cyber-blue">▸</span> Server Protection
                Enabled
              </p>
            </div>
          </div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
