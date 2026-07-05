export const GamePhase = {
  Setup: 'setup',
  Processing: 'processing',
  Success: 'success',
  Error: 'error',
} as const;

export const GAME_PHASE_VALUES = [
  GamePhase.Setup,
  GamePhase.Processing,
  GamePhase.Success,
  GamePhase.Error,
] as const;

export type GamePhaseValue = (typeof GAME_PHASE_VALUES)[number];
