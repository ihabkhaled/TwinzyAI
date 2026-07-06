/**
 * Public facade for the navigation package. next/navigation is imported only
 * inside this package.
 */

export type { AppNavigation } from './navigation-types';
export { appNotFound, appRedirect } from './server-navigation';
export { useAppNavigation } from './use-app-navigation.hook';
