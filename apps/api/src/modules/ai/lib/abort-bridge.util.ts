/**
 * Bridges an external cancel signal (client cancel, disconnect, watchdog)
 * onto a call's AbortController, so cancelling upstream immediately aborts
 * the in-flight provider request instead of letting it run to completion.
 * Returns a detach cleanup, or undefined when there was nothing to attach.
 *
 * Single owner for this cancellation-critical logic: BOTH provider adapters
 * (Gemini SDK + OpenAI-compatible fetch) use it — a silent divergence here
 * would change cancel/disconnect semantics per provider.
 */
export const attachExternalAbort = (
  controller: AbortController,
  externalSignal?: AbortSignal,
): (() => void) | undefined => {
  if (externalSignal === undefined) {
    return undefined;
  }
  if (externalSignal.aborted) {
    controller.abort();
    return undefined;
  }
  const onExternalAbort = (): void => {
    controller.abort();
  };
  externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  return () => {
    externalSignal.removeEventListener('abort', onExternalAbort);
  };
};
