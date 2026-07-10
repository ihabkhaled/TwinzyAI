/**
 * The four mutually exclusive states of the game flow. Modeled as an
 * `as const` object plus a derived union (never a TypeScript `enum`) so the
 * value set is a single source of truth the container switches on.
 */
export const GamePhase = {
  Setup: 'setup',
  Processing: 'processing',
  Success: 'success',
  Error: 'error',
} as const;

export type GamePhaseValue = (typeof GamePhase)[keyof typeof GamePhase];
