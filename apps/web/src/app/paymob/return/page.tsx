import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { PaymobReturnContainer } from '@/modules/game';
import { PageContainer } from '@/packages/ui-primitives';

/**
 * The redirect target Paymob's hosted checkout lands on after payment. It runs
 * inside the checkout popup only: it relays the transaction id to the opener and
 * closes itself. Never indexed — it carries no user data and is not a real page.
 */
export function generateMetadata(): Metadata {
  return { robots: { index: false, follow: false } };
}

const PaymobReturnPage = (): ReactElement => (
  <PageContainer>
    <PaymobReturnContainer />
  </PageContainer>
);

export default PaymobReturnPage;
