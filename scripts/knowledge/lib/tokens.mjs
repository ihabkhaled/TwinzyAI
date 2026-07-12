/**
 * Token estimation for context budgeting.
 *
 * Uses the standard ~4 characters/token heuristic for English/Markdown/code.
 * Estimates are used for budgets and routing decisions only — never for
 * correctness — so a deterministic heuristic beats a tokenizer dependency.
 */
const CHARS_PER_TOKEN = 4;

export const estimateTokens = (text) => Math.ceil(text.length / CHARS_PER_TOKEN);
