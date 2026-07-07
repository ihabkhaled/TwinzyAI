import type { ReactElement } from 'react';

import { LandingContainer } from '@/modules/game';
import { PageContainer } from '@/packages/ui-primitives';

const HomePage = (): ReactElement => (
  <PageContainer>
    <LandingContainer />
  </PageContainer>
);

export default HomePage;
