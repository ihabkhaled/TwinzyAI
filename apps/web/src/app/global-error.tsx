'use client';
// client-boundary-reason: the root error boundary replaces the entire document after a render crash and re-hydrates in the browser without the app CSS or i18n runtime.

import type { CSSProperties, ReactElement } from 'react';

import { FALLBACK_ERROR_COPY } from '@/shared/constants/fallback-copy.constants';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const bodyStyle: CSSProperties = {
  margin: 0,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  backgroundColor: '#13111c',
  color: '#f2f0fa',
};

const cardStyle: CSSProperties = {
  maxWidth: '32rem',
  textAlign: 'center',
};

const buttonStyle: CSSProperties = {
  marginTop: '1.5rem',
  padding: '0.625rem 1.25rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  backgroundColor: '#a78bfa',
  color: '#1c1927',
};

const GlobalError = ({ reset }: GlobalErrorProps): ReactElement => (
  <html lang="en">
    <body style={bodyStyle}>
      <main style={cardStyle}>
        <h1>{FALLBACK_ERROR_COPY.title}</h1>
        <p>{FALLBACK_ERROR_COPY.description}</p>
        <button type="button" style={buttonStyle} onClick={reset}>
          {FALLBACK_ERROR_COPY.retry}
        </button>
      </main>
    </body>
  </html>
);

export default GlobalError;
