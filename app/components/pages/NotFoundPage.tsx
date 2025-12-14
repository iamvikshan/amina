import type { FC } from 'hono/jsx';
import { SITE } from '@config/site';
import { ImagePaths } from '@utils/cdn';
import { BaseLayout } from '@components/layouts/BaseLayout';
import { Btn404 } from '@components/ui/buttons/Btn404';
import { SecondaryBtn } from '@components/ui/buttons/SecondaryBtn';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

interface NotFoundPageProps {
  title?: string;
}

export const NotFoundPage: FC<NotFoundPageProps> = ({
  title = `you are so lost! | ${SITE.title}`,
}) => {
  const particlesScript =
    `
    // Create error particles
    const container = document.querySelector('.error-particles');
    if (container) {
      for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = ` +
    '`' +
    `
          position: absolute;
          width: ${Math.random() * 3 + 1}px;
          height: ${Math.random() * 3 + 1}px;
          background: ${Math.random() > 0.5 ? '#DC143C' : '#00CED1'};
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          opacity: ${Math.random() * 0.5 + 0.2};
          animation: error-float ${Math.random() * 10 + 5}s linear infinite;
          animation-delay: ${Math.random() * 5}s;
        ` +
    '`' +
    `;
        container.appendChild(particle);
      }
    }

    // Add error particle animation
    const style = document.createElement('style');
    style.textContent = ` +
    '`' +
    `
      @keyframes error-float {
        0% {
          transform: translateY(0) translateX(0);
        }
        50% {
          transform: translateY(-30px) translateX(${Math.random() * 20 - 10}px);
        }
        100% {
          transform: translateY(0) translateX(0);
        }
      }
    ` +
    '`' +
    `;
    document.head.appendChild(style);
  `;

  return (
    <BaseLayout title={title}>
      <section class="relative overflow-hidden bg-gradient-to-b from-night-black via-night-shadow to-night-black min-h-svh flex items-center">
        <div class="absolute inset-0">
          <div class='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwQ0VEMSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=")] opacity-30' />

          <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-amina-crimson/20 rounded-full blur-3xl animate-pulse" />
          <div
            class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-blue/20 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 1s;"
          />

          <div class="error-particles absolute inset-0" />
        </div>

        <div class="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 w-full py-20">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div class="space-y-8 text-center lg:text-left">
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-night-steel/50 backdrop-blur-md border border-amina-crimson/30 text-amina-crimson lg:inline-flex">
                <LucideIcon name="alert-triangle" size={20} />
                <span class="text-sm font-heading font-bold tracking-wider uppercase">
                  CODE red
                </span>
              </div>

              <div class="space-y-4">
                <h1 class="text-8xl lg:text-9xl font-heading font-bold text-white">
                  <span class="text-amina-crimson">4</span>
                  <span class="text-cyber-blue">0h</span>
                  <span class="text-amina-crimson">4!</span>
                </h1>
                <p class="text-lg text-gray-400 font-mono tracking-wider">
                  [WARNING]: YOU TOOK A WRONG TURN, KID
                </p>
              </div>

              <div class="space-y-4">
                <h2 class="text-4xl lg:text-5xl font-heading font-bold text-white">
                  Oops,{' '}
                  <span class="bg-gradient-to-r from-amina-crimson to-cyber-blue bg-clip-text text-transparent">
                    you broke it!
                  </span>
                </h2>
                <p class="text-xl text-gray-300 leading-relaxed">
                  listen, this page doesn't exist. neither does whatever you
                  were looking for. nice try though, i'll give you that.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 pt-4">
                <Btn404 text="get your act together" icon="ghost" />
                <SecondaryBtn url="/" text="start over" icon="house-plug" />
              </div>

              <p class="text-gray-500 text-sm">
                <span class="text-2xl">( •̀ω•́ )σ</span> — maybe go find something
                useful to do instead?
              </p>
            </div>

            <div class="flex justify-center lg:justify-end">
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-t from-amina-crimson/30 via-transparent to-transparent blur-3xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-700" />

                <div class="relative">
                  <img
                    src={ImagePaths.portraits.alert}
                    alt="Amina - Alert Expression"
                    class="w-full max-w-md h-auto relative z-10 drop-shadow-2xl animate-float"
                    loading="lazy"
                  />

                  <div class="absolute -top-6 left-1/4 animate-float-delayed-1">
                    <div class="px-4 py-2 bg-night-steel/80 backdrop-blur-md border border-amina-crimson rounded-lg text-amina-crimson text-sm font-mono">
                      [YIKES!]
                    </div>
                  </div>

                  <div class="absolute top-20 -right-8 animate-float-delayed-2">
                    <div class="px-4 py-2 bg-night-steel/80 backdrop-blur-md border border-cyber-blue rounded-lg text-cyber-blue text-sm font-mono">
                      [4·0·4]
                    </div>
                  </div>

                  <div class="absolute bottom-1/3 -left-6 animate-float-delayed-3">
                    <div class="px-4 py-2 bg-night-steel/80 backdrop-blur-md border border-imperial-gold rounded-lg text-imperial-gold text-sm font-mono">
                      [NOT FOUND]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>
        {`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }

          .animate-float-delayed-1 {
            animation: float 4s ease-in-out infinite;
            animation-delay: 0.5s;
          }

          .animate-float-delayed-2 {
            animation: float 5s ease-in-out infinite;
            animation-delay: 1s;
          }

          .animate-float-delayed-3 {
            animation: float 4.5s ease-in-out infinite;
            animation-delay: 1.5s;
          }
        `}
      </style>

      <script dangerouslySetInnerHTML={{ __html: particlesScript }} />
    </BaseLayout>
  );
};
