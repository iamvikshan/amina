import { createRoute } from 'honox/factory';
import { BaseLayout } from '@components/layouts/BaseLayout';
import { Header } from '@components/navigation/Header';
import { FooterSection } from '@components/navigation/FooterSection';
import { HeroAmina } from '@components/sections/HeroAmina';
import {
  GuardianArsenal,
  type GuardianFeature,
} from '@components/sections/GuardianArsenal';
import { DeploymentSteps } from '@components/sections/DeploymentSteps';
import { RankShowcase } from '@components/sections/RankShowcase';
import { GuardianTestimonials } from '@components/sections/GuardianTestimonials';
import { BattleStats } from '@components/sections/BattleStats';
import { CTAGuardian } from '@components/sections/CTAGuardian';
import { getBotStats } from '@/lib/botStats';
import { getUptimeStats } from '@lib/uptime';

export default createRoute(async (c) => {
  let guildCount = 50000;
  let memberCount = 5000000;
  let ping = 0;
  let status: 'online' | 'idle' | 'dnd' | 'invisible' = 'online';

  try {
    const botStats = await getBotStats();
    guildCount = botStats.guildCount || guildCount;
    memberCount = botStats.memberCount || memberCount;
    ping = botStats.ping || ping;
    status = botStats.status || status;
  } catch {
    // fall back to defaults
  }

  let uptime = 99.9;
  try {
    const uptimeStats = await getUptimeStats();
    uptime = uptimeStats.uptime;
  } catch {
    // fall back to default
  }

  const formattedGuildCount =
    guildCount >= 1000
      ? `${Math.floor(guildCount / 1000)}k+`
      : `${guildCount}+`;

  const guardianFeatures: GuardianFeature[] = [
    {
      icon: 'swords',
      kaomoji: '[X]',
      title: 'Tactical Moderation',
      subtitle: 'AUTO-MOD SYSTEM',
      description:
        'Advanced spam detection, profanity filtering, and automated warnings. Amina handles the night watch so you can sleep.',
      image: '/assets/images/automated-tools.avif',
      learnMoreUrl: 'https://docs.4mina.app/moderation',
    },
    {
      icon: 'palette',
      kaomoji: '(≧▽≦)',
      title: 'Creative Command Center',
      subtitle: 'ENGAGEMENT TOOLS',
      description:
        'Custom commands, interactive games, leveling systems, and social features. Keep your community active and entertained.',
      image: '/assets/images/dashboard-image.avif',
      learnMoreUrl: 'https://docs.4mina.app/commands',
    },
    {
      icon: 'bar-chart-3',
      kaomoji: '(｀･ω･´)',
      title: 'Realm Management',
      subtitle: 'ANALYTICS DASHBOARD',
      description:
        'Real-time server insights, member activity tracking, and growth metrics. Make data-driven decisions for your community.',
      image: '/assets/images/features-image.avif',
      learnMoreUrl: '/dash',
    },
  ];

  return c.render(
    <BaseLayout
      description="Amina - Elite Discord Guardian Bot. Tactical moderation, creative engagement, and 24/7 protection for your realm. Join the Night Guard Protocol."
      title="Amina - Your 24/7 Discord Guardian | Night Guard Protocol"
    >
      <Header />

      <main class="space-y-0">
        <HeroAmina formattedGuildCount={formattedGuildCount} uptime={uptime} />
        <GuardianArsenal features={guardianFeatures} />
        <DeploymentSteps
          protectedRealmsLabel={`${formattedGuildCount} Realms`}
        />
        <RankShowcase />
        <GuardianTestimonials
          formattedGuildCount={formattedGuildCount}
          uptime={uptime}
        />
        <BattleStats
          guildCount={guildCount}
          memberCount={memberCount}
          uptime={uptime}
        />
        <CTAGuardian ping={ping} status={status} />
      </main>

      <FooterSection />

      <script type="module" src="/assets/scripts/hydrateMetrics.js"></script>
    </BaseLayout>
  );
});
