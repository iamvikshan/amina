import type { FC } from 'hono/jsx';
import { ImagePaths } from '@/utils/cdn';
import { LucideIcon } from '@/components/ui/icons/LucideIcon';

interface Testimonial {
  name: string;
  role: string;
  rank: string;
  rankBadge: string;
  rankColor: string;
  avatar: string;
  quote: string;
  kaomoji: string;
  servername: string;
  serverSize: string;
}

interface GuardianTestimonialsProps {
  formattedGuildCount: string;
  uptime: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Alex Rivera',
    role: 'Community Manager',
    rank: 'Legend',
    rankBadge: ImagePaths.badges.legend,
    rankColor: '#DC143C',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    quote:
      "Amina transformed our 50k member server. Moderation is seamless, engagement tripled, and I finally get sleep. Best bot decision we've ever made.",
    kaomoji: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
    servername: 'Gaming Legion',
    serverSize: '50k members',
  },
  {
    name: 'Sarah Chen',
    role: 'Server Owner',
    rank: 'Commander',
    rankBadge: ImagePaths.badges.commander,
    rankColor: '#FFD700',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    quote:
      'The custom commands and automated workflows saved us hundreds of hours. Amina feels like having a full mod team working 24/7.',
    kaomoji: '(≧▽≦)',
    servername: 'Creative Hub',
    serverSize: '18k members',
  },
  {
    name: 'Marcus Thompson',
    role: 'Discord Admin',
    rank: 'Guard',
    rankBadge: ImagePaths.badges.guard,
    rankColor: '#4169E1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    quote:
      'Setup took 2 minutes. Within a week, our server activity doubled. The analytics dashboard is a game-changer for understanding our community.',
    kaomoji: '(☆▽☆)',
    servername: 'Tech Innovators',
    serverSize: '12k members',
  },
  {
    name: 'Emma Rodriguez',
    role: 'Esports Coordinator',
    rank: 'Elite',
    rankBadge: ImagePaths.badges.elite,
    rankColor: '#9370DB',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    quote:
      'Tournament automation with Amina is incredible. Bracket management, role assignments, and notifications all happen automatically.',
    kaomoji: '(｀･ω･´)',
    servername: 'Esports Arena',
    serverSize: '8k members',
  },
  {
    name: 'David Kim',
    role: 'Content Creator',
    rank: 'Scout',
    rankBadge: ImagePaths.badges.scout,
    rankColor: '#00CED1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    quote:
      "As a streamer, Amina's Twitch integration and subscriber perks system are perfect. My community loves the automated rewards.",
    kaomoji: '(๑•̀ㅂ•́)و',
    servername: 'Stream Squad',
    serverSize: '5k members',
  },
  {
    name: 'Lisa Anderson',
    role: 'Education Lead',
    rank: 'Elite',
    rankBadge: ImagePaths.badges.elite,
    rankColor: '#9370DB',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    quote:
      'Running a study server with Amina is effortless. Study room management, timer commands, and focus mode features are brilliant.',
    kaomoji: '(｀･ω･´)',
    servername: 'Study Together',
    serverSize: '6k members',
  },
];

export const GuardianTestimonials: FC<GuardianTestimonialsProps> = ({
  formattedGuildCount,
  uptime,
}) => {
  const styleText = `
    /* Pixelated badge rendering */
    .pixelated {
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    }

    /* Shadow glow effect */
    .hover\\:shadow-glow:hover {
      box-shadow: 0 0 30px rgba(0, 206, 209, 0.3);
    }

    /* Staggered card entrance */
    .testimonial-card {
      opacity: 0;
      transform: translateY(30px);
      animation: fade-in-up 0.6s ease-out forwards;
    }

    .testimonial-card[data-index='0'] { animation-delay: 0.1s; }
    .testimonial-card[data-index='1'] { animation-delay: 0.2s; }
    .testimonial-card[data-index='2'] { animation-delay: 0.3s; }
    .testimonial-card[data-index='3'] { animation-delay: 0.4s; }
    .testimonial-card[data-index='4'] { animation-delay: 0.5s; }
    .testimonial-card[data-index='5'] { animation-delay: 0.6s; }

    @keyframes fade-in-up {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  const script = `
    // Intersection observer for scroll animations
    const testimonialCards = document.querySelectorAll('.testimonial-card');

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

    testimonialCards.forEach((card) => {
      observer.observe(card);
    });
  `;

  return (
    <>
      <section class="py-20 md:py-32 bg-gradient-to-b from-night-shadow via-night-steel/20 to-night-shadow relative overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute top-20 left-10 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl" />
          <div class="absolute bottom-20 right-10 w-96 h-96 bg-amina-crimson/10 rounded-full blur-3xl" />
        </div>

        <div class="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 space-y-4">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-night-steel/50 backdrop-blur-md border border-cyber-blue/30 text-cyber-blue">
              <LucideIcon name="radio" class="text-cyber-blue" size={20} />
              <span class="text-sm font-heading font-bold tracking-wider uppercase">
                Guardian Field Reports
              </span>
            </div>

            <h2 class="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
              Trusted by{' '}
              <span
                class="bg-gradient-to-r from-cyber-blue via-imperial-gold to-amina-crimson bg-clip-text text-transparent"
                data-stat="guilds-formatted"
              >
                {formattedGuildCount} Realms
              </span>
            </h2>

            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              Real guardians. Real results. Hear from community leaders who
              deploy Amina every day.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                class="testimonial-card group relative bg-gradient-to-br from-night-steel/70 to-night-shadow/70 backdrop-blur-md border-2 border-gray-700/50 rounded-2xl p-6 transition-all duration-500 hover:border-[var(--rank-color)] hover:scale-105 hover:shadow-glow"
                style={`--rank-color: ${testimonial.rankColor};`}
                data-index={index}
              >
                <div class="absolute -top-4 -left-4 text-6xl text-cyber-blue/20 font-serif">
                  "
                </div>

                <div class="flex items-start gap-4 mb-4">
                  <div class="relative">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      class="w-16 h-16 rounded-full border-2 border-gray-700 group-hover:border-[var(--rank-color)] transition-colors duration-300"
                    />
                    <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-night-shadow" />
                  </div>

                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-lg font-heading font-bold text-white group-hover:text-[var(--rank-color)] transition-colors duration-300">
                        {testimonial.name}
                      </h3>
                      <span class="text-lg">{testimonial.kaomoji}</span>
                    </div>
                    <p class="text-sm text-gray-400">{testimonial.role}</p>
                    <p class="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <svg
                        class="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      {testimonial.servername} · {testimonial.serverSize}
                    </p>
                  </div>

                  <div class="relative group/badge">
                    <div
                      class="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={`background: ${testimonial.rankColor}33;`}
                    />
                    <img
                      src={testimonial.rankBadge}
                      alt={`${testimonial.rank} Badge`}
                      class="relative w-12 h-12 pixelated transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
                    />
                    <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-night-shadow border border-[var(--rank-color)] rounded text-xs font-mono text-[var(--rank-color)] whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300 pointer-events-none">
                      {testimonial.rank}
                    </div>
                  </div>
                </div>

                <blockquote class="text-gray-300 leading-relaxed text-sm mb-4">
                  {testimonial.quote}
                </blockquote>

                <div class="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div class="flex items-center gap-2 text-green-500 text-xs font-medium">
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Verified Guardian</span>
                  </div>

                  <div class="text-xs text-gray-500 font-mono">
                    {testimonial.rank} Rank
                  </div>
                </div>

                <div class="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[var(--rank-color)]/30 group-hover:border-[var(--rank-color)] transition-colors duration-300" />
              </div>
            ))}
          </div>

          <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="text-center p-6 bg-night-steel/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div class="text-3xl font-heading font-bold text-white mb-1">
                4.9/5
              </div>
              <p class="text-sm text-gray-400">Average Rating</p>
              <div class="flex items-center justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    class="w-4 h-4 text-imperial-gold"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            <div class="text-center p-6 bg-night-steel/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div class="text-3xl font-heading font-bold text-white mb-1">
                {uptime.toFixed(1)}%
              </div>
              <p class="text-sm text-gray-400">Uptime</p>
            </div>

            <div class="text-center p-6 bg-night-steel/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div class="text-3xl font-heading font-bold text-white mb-1">
                24/7
              </div>
              <p class="text-sm text-gray-400">Guardian Active</p>
            </div>

            <div class="text-center p-6 bg-night-steel/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div class="text-3xl font-heading font-bold text-white mb-1">
                {formattedGuildCount}
              </div>
              <p class="text-sm text-gray-400">Protected Realms</p>
            </div>
          </div>
        </div>
      </section>

      <style>{styleText}</style>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
};
