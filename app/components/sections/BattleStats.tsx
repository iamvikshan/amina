import type { FC } from 'hono/jsx';
import { LucideIcon } from '@components/ui/icons/LucideIcon';

interface Stat {
  icon: string;
  value: string;
  suffix: string;
  label: string;
  description: string;
  color: string;
  kaomoji: string;
  dataStat: string | null;
}

interface BattleStatsProps {
  guildCount: number;
  memberCount: number;
  uptime: number;
}

export const BattleStats: FC<BattleStatsProps> = ({
  guildCount,
  memberCount,
  uptime,
}) => {
  const stats: Stat[] = [
    {
      icon: 'shield',
      value: guildCount.toString(),
      suffix: '+',
      label: 'Protected Realms',
      description: 'Discord servers trust Amina',
      color: 'cyber-blue',
      kaomoji: '[>]',
      dataStat: 'guilds',
    },
    {
      icon: 'swords',
      value: '1000000',
      suffix: '+',
      label: 'Actions Moderated',
      description: 'Automated mod decisions daily',
      color: 'amina-crimson',
      kaomoji: '[X]',
      dataStat: null,
    },
    {
      icon: 'users',
      value: memberCount.toString(),
      suffix: '+',
      label: 'Members Protected',
      description: 'Users in Amina-guarded realms',
      color: 'imperial-gold',
      kaomoji: '[*]',
      dataStat: 'members',
    },
    {
      icon: 'zap',
      value: uptime.toString(),
      suffix: '%',
      label: 'Uptime',
      description: 'Always on, always guarding',
      color: 'green-500',
      kaomoji: '[!]',
      dataStat: 'uptime',
    },
  ];

  const styleText = `
    /* Pulse animation for orbs */
    @keyframes pulse-slow {
      0%,
      100% {
        opacity: 0.1;
        transform: scale(1);
      }
      50% {
        opacity: 0.3;
        transform: scale(1.1);
      }
    }

    .animate-pulse-slow {
      animation: pulse-slow 4s ease-in-out infinite;
    }

    /* Shadow glow effect */
    .hover\\:shadow-glow:hover {
      box-shadow: 0 0 40px var(--stat-color);
    }

    /* Progress bar animation */
    .progress-bar {
      animation: progress-fill 2s ease-out forwards;
      animation-delay: 0.5s;
    }

    @keyframes progress-fill {
      from {
        width: 0%;
      }
      to {
        width: 100%;
      }
    }

    /* Staggered card entrance */
    .stat-card {
      opacity: 0;
      transform: translateY(50px) scale(0.9);
      animation: fade-in-up-scale 0.8s ease-out forwards;
    }

    .stat-card[data-index='0'] { animation-delay: 0.1s; }
    .stat-card[data-index='1'] { animation-delay: 0.2s; }
    .stat-card[data-index='2'] { animation-delay: 0.3s; }
    .stat-card[data-index='3'] { animation-delay: 0.4s; }

    @keyframes fade-in-up-scale {
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;

  const script = `
    // GSAP Counter Animation (simple interval-based)
    function animateCounter(element, target) {
      let current = 0;
      const duration = 2000;
      const increment = target / (duration / 16);
      const isDecimal = target < 100;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }

        const formatted = isDecimal
          ? current.toFixed(1)
          : Math.floor(current).toLocaleString();

        element.textContent = formatted;
      }, 16);
    }

    const statCards = document.querySelectorAll('.stat-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');

            const numberElement = entry.target.querySelector('.stat-number');
            const target = parseFloat(
              (numberElement && numberElement.getAttribute('data-target')) || '0'
            );

            setTimeout(() => {
              if (numberElement) animateCounter(numberElement, target);
            }, 200);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    statCards.forEach((card) => {
      observer.observe(card);
    });
  `;

  return (
    <>
      <section class="py-20 md:py-32 bg-night-shadow relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="circuit"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M10 10h20v20h-20z M40 10h20v20h-20z M10 40h20v20h-20z M40 40h20v20h-20z M70 10h20v20h-20z M70 40h20v20h-20z"
                  stroke="#00CED1"
                  stroke-width="1"
                  fill="none"
                />
                <circle cx="30" cy="30" r="3" fill="#DC143C" />
                <circle cx="60" cy="20" r="2" fill="#FFD700" />
                <circle cx="80" cy="50" r="2" fill="#00CED1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>

        <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyber-blue/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          class="absolute bottom-0 right-1/4 w-96 h-96 bg-amina-crimson/20 rounded-full blur-3xl animate-pulse-slow"
          style="animation-delay: 1s;"
        />

        <div class="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 space-y-4">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-night-steel/50 backdrop-blur-md border border-amina-crimson/30 text-amina-crimson">
              <LucideIcon name="zap" class="text-amina-crimson" size={20} />
              <span class="text-sm font-heading font-bold tracking-wider uppercase">
                Battle-Tested Performance
              </span>
            </div>

            <h2 class="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
              Guardian{' '}
              <span class="bg-gradient-to-r from-amina-crimson via-imperial-gold to-cyber-blue bg-clip-text text-transparent">
                Statistics
              </span>
            </h2>

            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              Real numbers from the field. Amina doesn't just promise
              protection—she delivers it at scale, every single day.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                class="stat-card group relative"
                data-index={index}
                data-target={stat.value}
                data-suffix={stat.suffix}
              >
                <div
                  class="relative bg-gradient-to-br from-night-steel/70 to-night-shadow/70 backdrop-blur-md border-2 border-gray-700/50 rounded-2xl p-8 transition-all duration-500 hover:border-[var(--stat-color)] hover:scale-105 hover:shadow-glow"
                  style={`--stat-color: ${
                    stat.color === 'cyber-blue'
                      ? '#00CED1'
                      : stat.color === 'amina-crimson'
                        ? '#DC143C'
                        : stat.color === 'imperial-gold'
                          ? '#FFD700'
                          : '#10B981'
                  };`}
                >
                  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--stat-color)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div class="flex items-center justify-between mb-6">
                    <div class="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                      <LucideIcon
                        name={stat.icon}
                        class="text-[var(--stat-color)]"
                        size={48}
                      />
                    </div>
                    <div class="text-2xl text-[var(--stat-color)] opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                      {stat.kaomoji}
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="flex items-baseline gap-1">
                      <span
                        class="stat-number text-5xl font-heading font-bold text-white group-hover:text-[var(--stat-color)] transition-colors duration-300"
                        data-target={stat.value}
                        data-stat={stat.dataStat}
                      >
                        0
                      </span>
                      <span class="text-3xl font-heading font-bold text-[var(--stat-color)]">
                        {stat.suffix}
                      </span>
                    </div>
                  </div>

                  <h3 class="text-xl font-heading font-bold text-white mb-2 group-hover:text-[var(--stat-color)] transition-colors duration-300">
                    {stat.label}
                  </h3>

                  <p class="text-sm text-gray-400 leading-relaxed">
                    {stat.description}
                  </p>

                  <div class="mt-6 h-1 bg-night-shadow rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-[var(--stat-color)] to-transparent progress-bar"
                      style="width: 0%;"
                    />
                  </div>

                  <div class="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[var(--stat-color)]/30 group-hover:border-[var(--stat-color)] transition-colors duration-300" />
                </div>
              </div>
            ))}
          </div>

          <div class="mt-16 text-center">
            <div class="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-night-steel/50 to-night-shadow/50 backdrop-blur-md border border-cyber-blue/30 rounded-2xl">
              <p class="text-lg text-gray-300 flex items-center gap-2">
                <svg
                  class="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>All statistics updated in real-time</span>
                <span class="text-2xl">(•̀ᴗ•́)و</span>
              </p>

              <div class="flex items-center gap-6 text-sm text-gray-400">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  System Status: Operational
                </span>
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
                  API Response: &lt;50ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{styleText}</style>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
