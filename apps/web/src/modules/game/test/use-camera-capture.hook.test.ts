import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as cameraPackage from '@/packages/camera';

import { useCameraCapture } from '../hooks/useCameraCapture.hook';

vi.mock('@/packages/camera', () => ({
  requestCameraStream: vi.fn(),
  stopCameraStream: vi.fn(),
  captureFrameToFile: vi.fn(),
  isCameraSupported: vi.fn(() => true),
  CAMERA_FACING_MODES: { Front: 'user', Back: 'environment' },
  DEFAULT_CAMERA_FACING_MODE: 'environment',
}));

const requestMock = vi.mocked(cameraPackage.requestCameraStream);
const stopMock = vi.mocked(cameraPackage.stopCameraStream);
const captureMock = vi.mocked(cameraPackage.captureFrameToFile);

const fakeStream = { id: 'stream' } as unknown as MediaStream;

describe('useCameraCapture', () => {
  beforeEach(() => {
    requestMock.mockReset().mockResolvedValue(fakeStream);
    stopMock.mockReset();
    captureMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the camera and requests the rear stream by default', async () => {
    const { result } = renderHook(() => useCameraCapture(vi.fn()));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isMirrored).toBe(false);

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('environment');
    });
  });

  it('switches to the front camera and re-acquires the stream', async () => {
    const { result } = renderHook(() => useCameraCapture(vi.fn()));
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('environment');
    });

    act(() => {
      result.current.switchCamera();
    });

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('user');
    });
    expect(stopMock).toHaveBeenCalled();
  });

  it('toggles the mirror flag and captures a mirrored frame', async () => {
    const file = new File(['x'], 'camera-photo.jpg', { type: 'image/jpeg' });
    captureMock.mockResolvedValue(file);
    const { result } = renderHook(() => useCameraCapture(vi.fn()));
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalled();
    });

    act(() => {
      result.current.toggleMirror();
    });
    expect(result.current.isMirrored).toBe(true);

    act(() => {
      result.current.videoRef.current = document.createElement('video');
      result.current.capture();
    });

    await waitFor(() => {
      expect(captureMock).toHaveBeenCalledWith(expect.anything(), true);
    });
  });

  it('captures a frame, forwards the File, and closes', async () => {
    const file = new File(['x'], 'camera-photo.jpg', { type: 'image/jpeg' });
    captureMock.mockResolvedValue(file);
    const onCapture = vi.fn();
    const { result } = renderHook(() => useCameraCapture(onCapture));

    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalled();
    });

    act(() => {
      result.current.videoRef.current = document.createElement('video');
      result.current.capture();
    });

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(file);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('stores the error key when the stream cannot open', async () => {
    requestMock.mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useCameraCapture(vi.fn()));

    act(() => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.errorKey).toBe('game.cameraError');
    });
  });

  it('releases the camera on cancel', async () => {
    const { result } = renderHook(() => useCameraCapture(vi.fn()));
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalled();
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isOpen).toBe(false);
    expect(stopMock).toHaveBeenCalled();
  });

  it('stops the stream on unmount', async () => {
    const { result, unmount } = renderHook(() => useCameraCapture(vi.fn()));
    act(() => {
      result.current.open();
    });
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalled();
    });

    unmount();

    expect(stopMock).toHaveBeenCalled();
  });
});
