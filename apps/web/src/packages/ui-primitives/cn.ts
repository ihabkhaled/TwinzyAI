import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * The single owner of `clsx` + `tailwind-merge` for the whole web app.
 *
 * Merges any number of conditional class inputs into one deduplicated class
 * string where later Tailwind utilities win over earlier conflicting ones
 * (e.g. `cn('px-2', 'px-4')` -> `'px-4'`). Every design-system primitive and
 * every consumer composes classes through this facade so class precedence is
 * resolved in exactly one reviewed place.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
