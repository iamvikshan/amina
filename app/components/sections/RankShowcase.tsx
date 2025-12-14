import type { FC } from 'hono/jsx';
import { ImagePaths } from '@utils/cdn';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

interface Rank {
  id: number;
  name: string;
  badge: string;
  requirement: string;
  color: string;
  glowColor: string;
  description: string;
  kaomoji: string;
}

const ranks: Rank[] = [
  {
    id: 1,
    name: 'Recruit',
    badge: ImagePaths.badges.recruit,
    requirement: '1 Realm',
    color: '#808080',
    glowColor: 'rgba(128, 128, 128, 0.5)',
    description: 'Begin your guardian journey',
    kaomoji: '( •̀ω•́ )σ',
  },
  {
    id: 2,
    name: 'Scout',
    badge: ImagePaths.badges.scout,
    requirement: '2 Realms',
    color: '#00CED1',
    glowColor: 'rgba(0, 206, 209, 0.5)',
    description: 'Proven across multiple realms',
    kaomoji: '(๑•̀ㅂ•́)و',
  },
  {
    id: 3,
    name: 'Guard',
    badge: ImagePaths.badges.guard,
    requirement: '5 Realms',
    color: '#4169E1',
    glowColor: 'rgba(65, 105, 225, 0.5)',
    description: 'Defender of communities',
    kaomoji: '(｀･ω･´)',
  },
  {
    id: 4,
    name: 'Elite',
    badge: ImagePaths.badges.elite,
    requirement: '10 Realms',
    color: '#9370DB',
    glowColor: 'rgba(147, 112, 219, 0.5)',
    description: 'Master of coordination',
    kaomoji: '(☆▽☆)',
  },
  {
    id: 5,
    name: 'Commander',
    badge: ImagePaths.badges.commander,
    requirement: '15 Realms',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    description: 'Elite guardian leader',
    kaomoji: '(≧▽≦)',
  },
  {
    id: 6,
    name: 'Legend',
    badge: ImagePaths.badges.legend,
    requirement: '20+ Realms',
    color: '#DC143C',
    glowColor: 'rgba(220, 20, 60, 0.5)',
    description: 'Immortalized in guardian lore',
    kaomoji: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
  },
];

export const RankShowcase: FC = () => {
  const styleText = `
    .pixelated {
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    }

    @keyframes bounce-slow {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-5px) rotate(10deg); }
    }

    .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }

    .hover\\:shadow-glow:hover { box-shadow: 0 0 30px var(--rank-glow); }

    .rank-card {
      opacity: 0;
      transform: translateY(30px);
      animation: fade-in-up 0.6s ease-out forwards;
    }

    .rank-card[data-rank='1'] { animation-delay: 0.1s; }
    .rank-card[data-rank='2'] { animation-delay: 0.2s; }
    .rank-card[data-rank='3'] { animation-delay: 0.3s; }
    .rank-card[data-rank='4'] { animation-delay: 0.4s; }
    .rank-card[data-rank='5'] { animation-delay: 0.5s; }
    .rank-card[data-rank='6'] { animation-delay: 0.6s; }

    @keyframes fade-in-up {
      to { opacity: 1; transform: translateY(0); }
    }

    .bg-gradient-radial {
      background: radial-gradient(circle at center, var(--tw-gradient-stops));
    }
  `;

  const script = `
    const container = document.querySelector('.particles-container');
    if (container) {
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText =
          'position: absolute;' +
          'width: ' + (Math.random() * 4 + 2) + 'px;' +
          'height: ' + (Math.random() * 4 + 2) + 'px;' +
          'background: ' +
            (Math.random() > 0.5 ? '#00CED1' : '#DC143C') +
            ';' +
          'border-radius: 50%;' +
          'left: ' + Math.random() * 100 + '%;' +
          'top: ' + Math.random() * 100 + '%;' +
          'opacity: ' + (Math.random() * 0.5 + 0.2) + ';' +
          'animation: particle-float ' +
            (Math.random() * 10 + 5) +
            's linear infinite;' +
          'animation-delay: ' + Math.random() * 5 + 's;';
        container.appendChild(particle);
      }
    }

    const style = document.createElement('style');
    style.textContent =
      '@keyframes particle-float {' +
      '0% { transform: translateY(0) translateX(0); }' +
      '50% { transform: translateY(-20px) translateX(10px); }' +
      '100% { transform: translateY(0) translateX(0); }' +
      '}';
    document.head.appendChild(style);

    const rankCards = document.querySelectorAll('.rank-card');

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

    rankCards.forEach((card) => observer.observe(card));
  `;

  return (
    <>
      <section class="py-20 md:py-32 bg-night-shadow relative overflow-hidden">
        <div class="absolute inset-0">
          <div class="absolute inset-0 bg-gradient-radial from-cyber-blue/10 via-transparent to-amina-crimson/10"></div>
          <div class="particles-container absolute inset-0"></div>
        </div>

        <div class="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 space-y-4">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-night-steel/50 backdrop-blur-md border border-amina-crimson/30 text-amina-crimson">
              <span class="text-xl">[★]</span>
              <span class="text-sm font-heading font-bold tracking-wider uppercase">
                Guardian Progression System
              </span>
            </div>

            <h2 class="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
              Rise Through the{' '}
              <span class="bg-gradient-to-r from-imperial-gold via-amina-crimson to-cyber-blue bg-clip-text text-transparent">
                Ranks
              </span>
            </h2>

            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              Every realm you protect earns you honor. Track your progression
              and unlock exclusive badges as you become a legendary guardian.
            </p>
          </div>

          <div class="relative">
            <div class="hidden lg:block absolute top-1/2 left-0 right-0 h-2 transform -translate-y-1/2">
              <div class="h-full bg-gradient-to-r from-gray-600 via-purple-500 to-amina-crimson rounded-full opacity-30"></div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
              {ranks.map((rank, index) => (
                <div class="rank-card group relative" data-rank={rank.id}>
                  <div
                    class="relative bg-gradient-to-br from-night-steel/80 to-night-shadow/80 backdrop-blur-md border-2 border-gray-700/50 rounded-2xl p-6 transition-all duration-500 hover:border-[var(--rank-color)] hover:scale-110 hover:-translate-y-4 hover:shadow-glow"
                    style={`--rank-color: ${rank.color}; --rank-glow: ${rank.glowColor};`}
                  >
                    <div class="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-night-steel to-night-shadow border-2 border-gray-700 flex items-center justify-center">
                      <span class="text-xs font-bold text-gray-400 group-hover:text-[var(--rank-color)] transition-colors duration-300">
                        {rank.id}
                      </span>
                    </div>

                    <div class="relative mb-4">
                      <div
                        class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                        style={`background: ${rank.glowColor};`}
                      />

                      <div class="relative aspect-square">
                        <img
                          src={rank.badge}
                          alt={`${rank.name} Badge`}
                          class="w-full h-full object-contain pixelated transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[5deg]"
                          loading="lazy"
                        />
                      </div>

                      <div class="absolute -top-2 -right-2 text-xl animate-bounce-slow">
                        {rank.kaomoji}
                      </div>
                    </div>

                    <div class="text-center space-y-2">
                      <h3 class="text-xl font-heading font-bold text-gray-300 group-hover:text-[var(--rank-color)] transition-colors duration-300">
                        {rank.name}
                      </h3>

                      <p class="text-xs text-gray-400 leading-relaxed min-h-[2.5rem]">
                        {rank.description}
                      </p>

                      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-night-shadow/80 border border-gray-700/50 group-hover:border-[var(--rank-color)] transition-colors duration-300">
                        <svg
                          class="w-3 h-3 text-gray-400 group-hover:text-[var(--rank-color)] transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span class="text-xs font-mono text-gray-400 group-hover:text-[var(--rank-color)] transition-colors duration-300">
                          {rank.requirement}
                        </span>
                      </div>
                    </div>

                    {index < ranks.length - 1 ? (
                      <div class="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-[var(--rank-color)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-6 bg-gradient-to-br from-night-steel/50 to-night-shadow/50 backdrop-blur-md border border-cyber-blue/30 rounded-xl">
              <div class="flex justify-center mb-2">
                <LucideIcon name="trophy" class="text-cyber-blue" size={40} />
              </div>
              <div class="text-3xl font-heading font-bold text-white mb-1">
                6 Ranks
              </div>
              <p class="text-gray-400 text-sm">Unique progression tiers</p>
            </div>

            <div class="text-center p-6 bg-gradient-to-br from-night-steel/50 to-night-shadow/50 backdrop-blur-md border border-imperial-gold/30 rounded-xl">
              <div class="flex justify-center mb-2">
                <LucideIcon
                  name="sparkles"
                  class="text-imperial-gold"
                  size={40}
                />
              </div>
              <div class="text-3xl font-heading font-bold text-white mb-1">
                Pixel Art
              </div>
              <p class="text-gray-400 text-sm">Hand-crafted badge designs</p>
            </div>

            <div class="text-center p-6 bg-gradient-to-br from-night-steel/50 to-night-shadow/50 backdrop-blur-md border border-amina-crimson/30 rounded-xl">
              <div class="flex justify-center mb-2">
                <LucideIcon name="award" class="text-amina-crimson" size={40} />
              </div>
              <div class="text-3xl font-heading font-bold text-white mb-1">
                Permanent
              </div>
              <p class="text-gray-400 text-sm">Ranks never expire</p>
            </div>
          </div>

          <div class="text-center mt-12">
            <p class="text-gray-400 text-lg mb-4">
              Start at Recruit and climb to Legend{' '}
              <span class="text-2xl">(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</span>
            </p>
            <a
              href="/dash"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyber-blue to-imperial-gold text-night-shadow rounded-xl font-heading font-bold hover:scale-105 hover:shadow-glow-blue transition-all duration-300"
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Track Your Progress
            </a>
          </div>
        </div>
      </section>

      <style>{styleText}</style>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
