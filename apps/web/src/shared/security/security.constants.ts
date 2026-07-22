/**
 * Request header the proxy stamps the per-response CSP nonce onto, so Server
 * Components can read it and nonce any third-party tag they render. Shared so
 * the writer (proxy) and the readers can never drift apart.
 */
export const NONCE_HEADER_NAME = 'x-nonce';

/**
 * Request header the proxy stamps the current pathname onto, so the root layout
 * (which cannot see the URL otherwise) can apply route-scoped policy — today,
 * the editorial-pages-only ad allowlist.
 */
export const PATHNAME_HEADER_NAME = 'x-pathname';
