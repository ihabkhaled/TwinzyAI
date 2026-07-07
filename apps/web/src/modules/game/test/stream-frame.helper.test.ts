import { describe, expect, it } from 'vitest';

import type { GameStreamMessage } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import { isMatchingStreamFrame } from '../helpers/stream-frame.helper';

const TAB = '11111111-1111-4111-8111-111111111111';
const REQ = '22222222-2222-4222-8222-222222222222';

const stageFrame = (overrides: { tabId?: string; requestId?: string } = {}): GameStreamMessage => ({
  event: GameStreamEvent.Stage,
  stage: GameStreamStage.Judging,
  ...overrides,
});

describe('isMatchingStreamFrame', () => {
  it('accepts a frame stamped with this run’s tab + request ids', () => {
    expect(isMatchingStreamFrame(stageFrame({ tabId: TAB, requestId: REQ }), TAB, REQ)).toBe(true);
  });

  it('accepts a bare frame with no correlation ids (backward compatible)', () => {
    expect(isMatchingStreamFrame(stageFrame(), TAB, REQ)).toBe(true);
  });

  it('drops a frame from another run’s requestId', () => {
    expect(
      isMatchingStreamFrame(
        stageFrame({ requestId: '33333333-3333-4333-8333-333333333333' }),
        TAB,
        REQ,
      ),
    ).toBe(false);
  });

  it('drops a frame from another tab', () => {
    expect(
      isMatchingStreamFrame(
        stageFrame({ tabId: '44444444-4444-4444-8444-444444444444' }),
        TAB,
        REQ,
      ),
    ).toBe(false);
  });
});
