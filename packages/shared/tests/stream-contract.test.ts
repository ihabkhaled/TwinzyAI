import { describe, expect, it } from 'vitest';

import {
  CancelAnalysisRequestSchema,
  CancelAnalysisResponseSchema,
  GameStreamEvent,
  GameStreamMessageSchema,
  GameStreamStage,
  isTerminalStreamStatus,
  STREAM_ID_HEADERS,
  STREAM_STATUS_VALUES,
  StreamStatus,
  TERMINAL_STREAM_STATUS_VALUES,
} from '../src';

const TAB_ID = '123e4567-e89b-42d3-a456-426614174000';
const REQUEST_ID = '223e4567-e89b-42d3-a456-426614174001';
const STREAM_ID = '323e4567-e89b-42d3-a456-426614174002';

describe('StreamStatus', () => {
  it('exposes exactly the documented lifecycle values', () => {
    expect(STREAM_STATUS_VALUES).toEqual([
      'queued',
      'active',
      'completed',
      'failed',
      'cancelled',
      'rejected',
    ]);
  });

  it('classifies only completed/failed/cancelled/rejected as terminal', () => {
    expect(isTerminalStreamStatus(StreamStatus.Completed)).toBe(true);
    expect(isTerminalStreamStatus(StreamStatus.Failed)).toBe(true);
    expect(isTerminalStreamStatus(StreamStatus.Cancelled)).toBe(true);
    expect(isTerminalStreamStatus(StreamStatus.Rejected)).toBe(true);
    expect(isTerminalStreamStatus(StreamStatus.Queued)).toBe(false);
    expect(isTerminalStreamStatus(StreamStatus.Active)).toBe(false);
  });

  it('keeps the terminal set a strict subset of all statuses', () => {
    for (const status of TERMINAL_STREAM_STATUS_VALUES) {
      expect(STREAM_STATUS_VALUES).toContain(status);
    }
    expect(TERMINAL_STREAM_STATUS_VALUES.length).toBeLessThan(STREAM_STATUS_VALUES.length);
  });
});

describe('STREAM_ID_HEADERS', () => {
  it('are lowercase, namespaced, and distinct', () => {
    const names = Object.values(STREAM_ID_HEADERS);
    expect(names).toEqual(['x-twinzy-tab-id', 'x-twinzy-request-id', 'x-twinzy-stream-id']);
    for (const name of names) {
      expect(name).toBe(name.toLowerCase());
    }
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('GameStreamMessageSchema correlation envelope', () => {
  it('accepts a stage frame with a full envelope', () => {
    const parsed = GameStreamMessageSchema.safeParse({
      event: GameStreamEvent.Stage,
      stage: GameStreamStage.Judging,
      tabId: TAB_ID,
      requestId: REQUEST_ID,
      streamId: STREAM_ID,
      status: StreamStatus.Active,
    });
    expect(parsed.success).toBe(true);
  });

  it('still accepts a bare frame without the envelope (backward compatible)', () => {
    expect(
      GameStreamMessageSchema.safeParse({
        event: GameStreamEvent.Stage,
        stage: GameStreamStage.Validating,
      }).success,
    ).toBe(true);
    expect(GameStreamMessageSchema.safeParse({ event: GameStreamEvent.Accepted }).success).toBe(
      true,
    );
  });

  it('rejects a malformed correlation id or unknown status', () => {
    expect(
      GameStreamMessageSchema.safeParse({
        event: GameStreamEvent.Accepted,
        streamId: 'not-a-uuid',
      }).success,
    ).toBe(false);

    expect(
      GameStreamMessageSchema.safeParse({
        event: GameStreamEvent.Accepted,
        status: 'bogus',
      }).success,
    ).toBe(false);
  });
});

describe('CancelAnalysisRequestSchema', () => {
  it('accepts three matching uuids', () => {
    expect(
      CancelAnalysisRequestSchema.safeParse({
        tabId: TAB_ID,
        requestId: REQUEST_ID,
        streamId: STREAM_ID,
      }).success,
    ).toBe(true);
  });

  it('requires all three ids and rejects unknown keys', () => {
    expect(
      CancelAnalysisRequestSchema.safeParse({ tabId: TAB_ID, requestId: REQUEST_ID }).success,
    ).toBe(false);

    expect(
      CancelAnalysisRequestSchema.safeParse({
        tabId: TAB_ID,
        requestId: REQUEST_ID,
        streamId: STREAM_ID,
        extra: 'nope',
      }).success,
    ).toBe(false);
  });

  it('rejects non-uuid ids', () => {
    expect(
      CancelAnalysisRequestSchema.safeParse({
        tabId: 'tab',
        requestId: REQUEST_ID,
        streamId: STREAM_ID,
      }).success,
    ).toBe(false);
  });
});

describe('CancelAnalysisResponseSchema', () => {
  it('accepts a boolean cancelled flag and rejects extras', () => {
    expect(CancelAnalysisResponseSchema.safeParse({ cancelled: true }).success).toBe(true);
    expect(CancelAnalysisResponseSchema.safeParse({ cancelled: 'yes' }).success).toBe(false);
    expect(CancelAnalysisResponseSchema.safeParse({ cancelled: true, extra: 1 }).success).toBe(
      false,
    );
  });
});
