import type { AiRouteEntry } from '../../../config/ai-route.types';

export interface MultiModelCouncilInput {
  readonly prompt: string;
  readonly participants: readonly AiRouteEntry[];
  readonly minimumSuccessfulParticipants: number;
  readonly timeoutMs: number;
}

export interface MultiModelCouncilResult {
  readonly participantId: string;
  readonly text: string;
}

export interface CouncilParticipantTask {
  readonly participantId: string;
  readonly run: (signal: AbortSignal) => Promise<string>;
}
