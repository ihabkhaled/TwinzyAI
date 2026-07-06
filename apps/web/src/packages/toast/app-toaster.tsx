'use client';
// client-boundary-reason: sonner Toaster renders a portal into the DOM

import type { ReactElement } from 'react';
import { Toaster } from 'sonner';

/**
 * App-wide toast portal host. Mount once near the root of the client tree;
 * fire notifications through {@link showToast}. Top-centre placement reads
 * better on the mobile-first Twinzy layout.
 */
export function AppToaster(): ReactElement {
  return <Toaster position="top-center" richColors closeButton />;
}
