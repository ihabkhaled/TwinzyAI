/**
 * Server-safe re-export of next/navigation's `notFound`. Kept separate from
 * `use-app-navigation.hook.ts` because that file is a client-only boundary,
 * while `notFound()` must run in Server Components.
 */
export { notFound } from 'next/navigation';
