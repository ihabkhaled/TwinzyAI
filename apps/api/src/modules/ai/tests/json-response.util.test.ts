import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError, ErrorCode } from '../../../core/errors';
import { parseAiJsonResponse } from '../lib/json-response.util';

const Schema = z.object({ promptVersion: z.string(), count: z.number() });

const VALID = { promptVersion: 'v1', count: 3 };

describe('parseAiJsonResponse', () => {
  it('parses a clean JSON object', () => {
    expect(parseAiJsonResponse(JSON.stringify(VALID), Schema)).toEqual(VALID);
  });

  it('parses JSON wrapped in a markdown code fence', () => {
    const fenced = ['```json', JSON.stringify(VALID), '```'].join('\n');
    expect(parseAiJsonResponse(fenced, Schema)).toEqual(VALID);
  });

  it('extracts the JSON object from surrounding prose (fallback)', () => {
    const noisy = `Sure! Here is the translated result:\n${JSON.stringify(VALID)}\nHope that helps.`;
    expect(parseAiJsonResponse(noisy, Schema)).toEqual(VALID);
  });

  it('rejects a response with no JSON object at all', () => {
    const onIssues = vi.fn();
    let caught: unknown;
    try {
      parseAiJsonResponse('the model refused to answer', Schema, onIssues);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).errorCode).toBe(ErrorCode.AiResponseInvalid);
    expect(onIssues).toHaveBeenCalledWith('response is not valid JSON');
  });

  it('rejects a well-formed object that fails the schema, reporting paths only', () => {
    const onIssues = vi.fn();
    let caught: unknown;
    try {
      parseAiJsonResponse(JSON.stringify({ promptVersion: 'v1' }), Schema, onIssues);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect(onIssues).toHaveBeenCalledWith(expect.stringContaining('count'));
  });
});
