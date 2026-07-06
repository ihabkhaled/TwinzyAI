'use client';
// client-boundary-reason: exposes next-intl's context-reading translation/locale hooks, which only run in client components.

export { useLocale as useAppLocale, useTranslations as useAppTranslation } from 'next-intl';
