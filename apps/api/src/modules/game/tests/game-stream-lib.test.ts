import { describe, expect, it } from 'vitest';

import { GameStreamEvent, GameStreamStage, StreamStatus } from '@twinzy/shared';

import { IntegrationError } from '../../../core/errors';
import { StreamAbortReason } from '../../../core/streaming';
import {
  buildBusyStreamMessage,
  buildDuplicateStreamMessage,
  resolveStreamTermination,
  stampStreamFrame,
  statusForStreamEvent,
  toStreamErrorMessage,
} from '../lib/game-stream';
import { randomStreamId, resolveCorrelationId } from '../lib/stream-correlation';

const UUID = '123e4567-e89b-42d3-a456-426614174000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const abortedSignal = (reason?: unknown): AbortSignal => {
  const controller = new AbortController();
  controller.abort(reason);
  return controller.signal;
};

describe('statusForStreamEvent', () => {
  it('maps the result event to completed and everything else to active', () => {
    expect(statusForStreamEvent(GameStreamEvent.Result)).toBe(StreamStatus.Completed);
    expect(statusForStreamEvent(GameStreamEvent.Stage)).toBe(StreamStatus.Active);
    expect(statusForStreamEvent(GameStreamEvent.Accepted)).toBe(StreamStatus.Active);
    expect(statusForStreamEvent(GameStreamEvent.Traits)).toBe(StreamStatus.Active);
  });
});

describe('stampStreamFrame', () => {
  it('merges the full correlation envelope onto a frame', () => {
    const stamped = stampStreamFrame(
      { event: GameStreamEvent.Stage, stage: GameStreamStage.Judging },
      { tabId: 'tab', requestId: 'req', streamId: 'stream', status: StreamStatus.Active },
    );

    expect(stamped).toMatchObject({
      event: GameStreamEvent.Stage,
      stage: GameStreamStage.Judging,
      tabId: 'tab',
      requestId: 'req',
      streamId: 'stream',
      status: StreamStatus.Active,
    });
  });

  it('omits streamId when the stamp has none (rejection frames)', () => {
    const stamped = stampStreamFrame(buildBusyStreamMessage(), {
      tabId: 'tab',
      requestId: 'req',
      status: StreamStatus.Rejected,
    });

    expect(stamped.streamId).toBeUndefined();
    expect(stamped.status).toBe(StreamStatus.Rejected);
  });
});

describe('rejection frame builders', () => {
  it('build SERVER_BUSY error frames with distinct copy', () => {
    expect(buildBusyStreamMessage().errorCode).toBe('SERVER_BUSY');
    expect(buildDuplicateStreamMessage().errorCode).toBe('SERVER_BUSY');
    expect(buildBusyStreamMessage().message).not.toBe(buildDuplicateStreamMessage().message);
  });
});

describe('toStreamErrorMessage', () => {
  it('maps an app error to a safe in-band error frame', () => {
    const frame = toStreamErrorMessage(
      new IntegrationError('raw provider detail', 'errors.ai.providerUnavailable'),
    );

    expect(frame.event).toBe(GameStreamEvent.Error);
    expect(frame.errorCode).toBe('AI_PROVIDER_UNAVAILABLE');
    expect(frame.message).not.toContain('stack');
  });
});

describe('resolveStreamTermination', () => {
  it('returns null (silent) on a client disconnect', () => {
    expect(
      resolveStreamTermination(new Error('x'), abortedSignal(StreamAbortReason.Disconnect)),
    ).toBeNull();
  });

  it('maps a deliberate cancel to a cancelled terminal frame', () => {
    const termination = resolveStreamTermination(
      new Error('x'),
      abortedSignal(StreamAbortReason.Cancel),
    );

    expect(termination?.status).toBe(StreamStatus.Cancelled);
    expect(termination?.message.errorCode).toBe('ANALYSIS_CANCELLED');
  });

  it('maps a watchdog/TTL timeout to a failed timeout frame', () => {
    const termination = resolveStreamTermination(
      new Error('x'),
      abortedSignal(StreamAbortReason.Timeout),
    );

    expect(termination?.status).toBe(StreamStatus.Failed);
    expect(termination?.message.errorCode).toBe('AI_TIMEOUT');
  });

  it('maps a non-aborted failure through the safe error mapper', () => {
    const controller = new AbortController();
    const termination = resolveStreamTermination(
      new IntegrationError('raw provider detail', 'errors.ai.providerUnavailable'),
      controller.signal,
    );

    expect(termination?.status).toBe(StreamStatus.Failed);
    expect(termination?.message.errorCode).toBe('AI_PROVIDER_UNAVAILABLE');
  });
});

describe('stream correlation ids', () => {
  it('keeps a well-formed uuid and mints a fresh one otherwise', () => {
    const missing: string | undefined = undefined;
    expect(resolveCorrelationId(UUID)).toBe(UUID);
    expect(resolveCorrelationId('not-a-uuid')).toMatch(UUID_PATTERN);
    expect(resolveCorrelationId(missing)).toMatch(UUID_PATTERN);
    expect(resolveCorrelationId('not-a-uuid')).not.toBe(resolveCorrelationId('not-a-uuid'));
  });

  it('mints a valid uuid for each stream', () => {
    expect(randomStreamId()).toMatch(UUID_PATTERN);
    expect(randomStreamId()).not.toBe(randomStreamId());
  });
});
