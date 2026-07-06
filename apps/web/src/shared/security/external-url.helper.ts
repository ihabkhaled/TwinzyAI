const SAFE_PROTOCOLS = new Set(['https:', 'mailto:']);

/**
 * Guard for outbound links. Only fully-qualified `https:` and `mailto:` URLs
 * are considered safe to render as external links — everything else
 * (`http:`, `javascript:`, `data:`, relative or malformed input) is rejected,
 * so no unsafe scheme can be smuggled into an anchor's href.
 */
export function isSafeExternalUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);

    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}
