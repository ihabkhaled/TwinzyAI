import type { ReactNode } from 'react';

import { GameScreen } from '@/features/game';

const GamePage = (): ReactNode => (
  <main id="main-content" className="mx-auto max-w-xl px-4 py-8 pb-[env(safe-area-inset-bottom)]">
    <GameScreen />
  </main>
);

export default GamePage;
