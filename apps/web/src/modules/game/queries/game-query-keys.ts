import type { AppQueryKey } from '@/packages/query';

/** Cache address for the analyze mutation; the one source invalidation trusts. */
export const GAME_MUTATION_KEY: AppQueryKey = ['game', 'analyze'];

/** Cache address for the text-only translate-result mutation. */
export const TRANSLATE_MUTATION_KEY: AppQueryKey = ['game', 'translate-result'];
