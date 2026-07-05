import type { ReactNode } from 'react';

import { Alert } from '@/components/ui';

interface ErrorStateProps {
  message: string;
}

export const ErrorState = ({ message }: ErrorStateProps): ReactNode => (
  <Alert tone="danger">{message}</Alert>
);
