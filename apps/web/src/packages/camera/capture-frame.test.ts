import { afterEach, describe, expect, it, vi } from 'vitest';

import { CAPTURE_FILENAME, CAPTURE_MIME } from './camera.constants';
import { captureFrameToFile } from './capture-frame';

const buildVideo = (width: number, height: number): HTMLVideoElement =>
  ({ videoWidth: width, videoHeight: height }) as HTMLVideoElement;

const stubCanvas = (canvas: unknown): void => {
  vi.spyOn(document, 'createElement').mockReturnValue(canvas as HTMLCanvasElement);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('captureFrameToFile', () => {
  it('rejects when the video has no frame yet', async () => {
    await expect(captureFrameToFile(buildVideo(0, 0), false)).rejects.toThrow('CAMERA_NOT_READY');
  });

  it('rejects when a 2d context is unavailable', async () => {
    stubCanvas({ width: 0, height: 0, getContext: vi.fn(() => null) });
    await expect(captureFrameToFile(buildVideo(10, 10), false)).rejects.toThrow(
      'CAMERA_CAPTURE_FAILED',
    );
  });

  it('draws the frame and resolves a JPEG File identical to an upload', async () => {
    const blob = new Blob(['frame'], { type: CAPTURE_MIME });
    const context = { drawImage: vi.fn(), translate: vi.fn(), scale: vi.fn() };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: (value: Blob | null) => void) => {
        callback(blob);
      }),
    };
    stubCanvas(canvas);

    const file = await captureFrameToFile(buildVideo(640, 480), false);

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe(CAPTURE_FILENAME);
    expect(file.type).toBe(CAPTURE_MIME);
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480);
    expect(context.translate).not.toHaveBeenCalled();
    expect(context.scale).not.toHaveBeenCalled();
  });

  it('horizontally flips the canvas before drawing when mirrored', async () => {
    const blob = new Blob(['frame'], { type: CAPTURE_MIME });
    const context = { drawImage: vi.fn(), translate: vi.fn(), scale: vi.fn() };
    stubCanvas({
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: (value: Blob | null) => void) => {
        callback(blob);
      }),
    });

    await captureFrameToFile(buildVideo(640, 480), true);

    expect(context.translate).toHaveBeenCalledWith(640, 0);
    expect(context.scale).toHaveBeenCalledWith(-1, 1);
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480);
  });

  it('rejects when the canvas yields no blob', async () => {
    stubCanvas({
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn(), translate: vi.fn(), scale: vi.fn() })),
      toBlob: vi.fn((callback: (value: Blob | null) => void) => {
        callback(null);
      }),
    });

    await expect(captureFrameToFile(buildVideo(10, 10), false)).rejects.toThrow(
      'CAMERA_CAPTURE_FAILED',
    );
  });
});
