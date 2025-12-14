import type { FC } from 'hono/jsx';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

export interface GuardianFeature {
  icon: string;
  kaomoji: string;
  title: string;
  subtitle: string;
  description: string;
  learnMoreUrl?: string;
  image?: string;
}

interface GuardianArsenalProps {
  features: GuardianFeature[];
}

export const GuardianArsenal: FC<GuardianArsenalProps> = ({ features }) => {
  const styleText = `
    @keyframes bounce-slow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }

    .feature-card {
      opacity: 0;
      transform: translateY(30px);
      animation: fade-in-up 0.6s ease-out forwards;
    }

    .feature-card[data-index='0'] { animation-delay: 0.1s; }
    .feature-card[data-index='1'] { animation-delay: 0.2s; }
    .feature-card[data-index='2'] { animation-delay: 0.3s; }

    @keyframes fade-in-up {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  const script = `
    const featureCards = document.querySelectorAll('.feature-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );

    featureCards.forEach((card) => observer.observe(card));
  `;

  return (
    <>
      <section class="py-20 md:py-32 bg-night-shadow relative overflow-hidden">
        <div class='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImRvdHMiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMENFRDEiIG9wYWNpdHk9IjAuMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNkb3RzKSIvPjwvc3ZnPg==")] opacity-30'></div>

        <div class="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 space-y-4">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-night-steel/50 backdrop-blur-md border border-amina-crimson/30 text-amina-crimson">
              <span class="text-xl">[***]</span>
              <span class="text-sm font-heading font-bold tracking-wider uppercase">
                Amina's Guardian Capabilities
              </span>
            </div>

            <h2 class="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
              Your Guardian's{' '}
              <span class="bg-gradient-to-r from-amina-crimson to-rose-red bg-clip-text text-transparent">
                Arsenal
              </span>
            </h2>

            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              From tactical moderation to creative engagement, Amina brings a
              complete suite of guardian tools to protect and energize your
              Discord realm.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                class="feature-card group relative bg-gradient-to-br from-night-steel/50 to-night-shadow/50 backdrop-blur-md border-2 border-cyber-blue/20 rounded-2xl p-8 transition-all duration-500 hover:border-cyber-blue/60 hover:scale-105 hover:shadow-glow-blue"
                data-index={index}
              >
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div class="mb-6 relative">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-cyber-blue/10 border border-cyber-blue/30 group-hover:bg-cyber-blue/20 transition-all duration-300">
                    <LucideIcon
                      name={feature.icon}
                      class="text-cyber-blue"
                      size={32}
                    />
                  </div>
                  <div class="absolute -top-2 -right-2 text-2xl animate-bounce-slow">
                    {feature.kaomoji}
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <p class="text-xs font-mono text-cyber-blue uppercase tracking-widest mb-2">
                      {feature.subtitle}
                    </p>
                    <h3 class="text-2xl font-heading font-bold text-white group-hover:text-cyber-blue transition-colors duration-300">
                      {feature.title}
                    </h3>
                  </div>

                  <p class="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {feature.learnMoreUrl ? (
                    <a
                      href={feature.learnMoreUrl}
                      class="inline-flex items-center gap-2 text-cyber-blue hover:text-white transition-colors duration-300 font-medium group/link"
                    >
                      <span>Learn More</span>
                      <svg
                        class="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  ) : null}
                </div>

                {feature.image ? (
                  <div class="mt-6 rounded-lg overflow-hidden border border-cyber-blue/20">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      class="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                <div class="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-amina-crimson/20 group-hover:border-amina-crimson/60 transition-colors duration-300" />
              </div>
            ))}
          </div>

          <div class="text-center mt-16">
            <p class="text-gray-400 text-lg mb-4">
              Ready to explore all capabilities?{' '}
              <span class="text-xl">(•̀ᴗ•́)و</span>
            </p>
            <a
              href="https://docs.4mina.app/commands"
              class="inline-flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-imperial-gold text-imperial-gold rounded-xl font-heading font-bold hover:bg-imperial-gold/10 hover:scale-105 transition-all duration-300"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Full Command List
            </a>
          </div>
        </div>
      </section>

      <style>{styleText}</style>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
