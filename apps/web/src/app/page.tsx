import type { ReactNode } from 'react';

import { GameIntroCard, LandingHero, PrivacyNotice } from '@/features/game';
import { t } from '@/i18n';

const HomePage = (): ReactNode => (
  <main
    id="main-content"
    className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-10"
  >
    <LandingHero />
    <GameIntroCard />
    <PrivacyNotice />
    <footer className="text-center text-xs text-text-muted">{t('footer.note')}</footer>
  </main>
);

export default HomePage;
