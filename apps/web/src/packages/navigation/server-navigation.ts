/**
 * Server-side navigation facade. Server Components and server actions redirect
 * or trigger the not-found boundary through these re-exports so next/navigation
 * stays owned by this package.
 */

export { notFound as appNotFound, redirect as appRedirect } from 'next/navigation';
