import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCameraCaptureController } from '@/features/game/hooks/useCameraCaptureController';
import { captureFrameToFile, requestCameraStream, stopCameraStream } from '@/lib/camera';

vi.mock('@/lib/camera', () => ({
  requestCameraStream: vi.fn(),
  stopCameraStream: vi.fn(),
  captureFrameToFile: vi.fn(),
  isCameraSupported: vi.fn(() => true),
}));

const mockedRequest = vi.mocked(requestCameraStream);
const mockedStop = vi.mocked(stopCameraStream);
const mockedCapture = vi.mocked(captureFrameToFile);

const buildStream = (): MediaStream =>
  ({ getTracks: () => [{ stop: vi.fn() }] }) as unknown as MediaStream;

beforeEach(() => {
  mockedRequest.mockReset();
  mockedStop.mockReset();
  mockedCapture.mockReset();
});

describe('useCameraCaptureController', () => {
  it('opens the live camera stream when opened', async () => {
    mockedRequest.mockResolvedValue(buildStream());
    const { result } = renderHook(() => useCameraCaptureController(vi.fn()));

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    await waitFor(() => {
      expect(mockedRequest).toHaveBeenCalledTimes(1);
      expect(result.current.isStarting).toBe(false);
    });
    expect(result.current.errorMessage).toBeUndefined();
  });

  it('surfaces a friendly error when camera access is denied', async () => {
    mockedRequest.mockRejectedValue(new Error('NotAllowedError'));
    const { result } = renderHook(() => useCameraCaptureController(vi.fn()));

    act(() => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBeDefined();
    });
  });

  it('captures a frame, hands the file to onCapture, and closes', async () => {
    const file = new File([new Uint8Array([1])], 'camera-photo.jpg', { type: 'image/jpeg' });
    mockedRequest.mockResolvedValue(buildStream());
    mockedCapture.mockResolvedValue(file);
    const onCapture = vi.fn();
    const { result } = renderHook(() => useCameraCaptureController(onCapture));

    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(result.current.isStarting).toBe(false);
    });
    result.current.videoRef.current = document.createElement('video');

    act(() => {
      result.current.capture();
    });

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(file);
      expect(result.current.isOpen).toBe(false);
    });
  });

  it('stops the camera stream on cancel', async () => {
    mockedRequest.mockResolvedValue(buildStream());
    const { result } = renderHook(() => useCameraCaptureController(vi.fn()));

    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(mockedRequest).toHaveBeenCalled();
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isOpen).toBe(false);
    await waitFor(() => {
      expect(mockedStop).toHaveBeenCalled();
    });
  });

  it('releases the camera on unmount', async () => {
    mockedRequest.mockResolvedValue(buildStream());
    const { result, unmount } = renderHook(() => useCameraCaptureController(vi.fn()));

    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(mockedRequest).toHaveBeenCalled();
    });

    unmount();

    expect(mockedStop).toHaveBeenCalled();
  });
});
