/**
 * Token estimation for context budgeting.
 *
 * Uses the standard ~4 characters/token heuristic for English/Markdown/code.
 * Estimates are used for budgets and routing decisions only — never for
 * correctness — so a deterministic heuristic beats a tokenizer dependency.
 *
 * Line endings are LF-normalized before counting (matching `sha256Text`) so the
 * estimate is identical whether the checkout uses LF or CRLF; otherwise a
 * Windows CRLF checkout inflates every count by one char per line and the
 * generated manifests drift against a Linux CI rebuild.
 */
const CHARS_PER_TOKEN = 4;

export const estimateTokens = (text) =>
  Math.ceil(text.replaceAll('\r\n', '\n').length / CHARS_PER_TOKEN);
