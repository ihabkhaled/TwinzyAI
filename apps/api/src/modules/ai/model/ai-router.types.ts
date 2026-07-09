import type { AiProviderAdapter } from './ai-provider-adapter.types';

/**
 * One route-hop dispatch: the router (or shadow runner) invokes the chosen
 * adapter pinned to exactly the given models, under the given signal. The
 * closure carries the prompt/image so router internals never re-thread them.
 */
export type RouteDispatch = (
  adapter: AiProviderAdapter,
  models: readonly string[],
  signal?: AbortSignal,
) => Promise<string>;
