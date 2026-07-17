import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildCameraConstraints, CAMERA_FACING_MODES } from './camera.constants';
import { isCameraSupported, requestCameraStream, stopCameraStream } from './camera-stream';

const setMediaDevices = (value: unknown): void => {
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value,
    configurable: true,
    writable: true,
  });
};

afterEach(() => {
  setMediaDevices(undefined);
});

describe('isCameraSupported', () => {
  it('is false when mediaDevices is unavailable (SSR / insecure context)', () => {
    setMediaDevices(undefined);
    expect(isCameraSupported()).toBe(false);
  });

  it('is true when getUserMedia is a function', () => {
    setMediaDevices({ getUserMedia: vi.fn() });
    expect(isCameraSupported()).toBe(true);
  });
});

describe('requestCameraStream', () => {
  it('rejects when the browser cannot stream', async () => {
    setMediaDevices(undefined);
    await expect(requestCameraStream(CAMERA_FACING_MODES.Back)).rejects.toThrow(
      'CAMERA_UNSUPPORTED',
    );
  });

  it('opens the rear camera with audio disabled', async () => {
    const stream = {} as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });

    await expect(requestCameraStream(CAMERA_FACING_MODES.Back)).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith(buildCameraConstraints(CAMERA_FACING_MODES.Back));
  });

  it('opens the front camera when the front facing mode is requested', async () => {
    const stream = {} as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });

    await expect(requestCameraStream(CAMERA_FACING_MODES.Front)).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith(buildCameraConstraints(CAMERA_FACING_MODES.Front));
  });
});

describe('stopCameraStream', () => {
  it('stops every track so the device is released', () => {
    const stopA = vi.fn();
    const stopB = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopA }, { stop: stopB }],
    } as unknown as MediaStream;

    stopCameraStream(stream);

    expect(stopA).toHaveBeenCalledTimes(1);
    expect(stopB).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when there is no stream', () => {
    expect(() => {
      stopCameraStream();
    }).not.toThrow();
  });
});
